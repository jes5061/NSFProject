import BarChart from './components/BarChart'
import PieChart from './components/PieChart'     
import { spawn } from 'child_process'
import { BehaviorSubject, Observable } from 'rxjs'
import { match, tail, pipe, is, split, map, mergeAll, replace, prop, head, toPairs, always, values } from 'ramda'
import { djb2, hashStringToColor, lineToObj, convertToObject } from './util'

const tshark = spawn('tshark', ['-V'])
    
const app = document.getElementById('app')

const updateBar = BarChart("#BarChart")
const updatePie = PieChart("#PieChart")

//--------------------------
// Start / Stop button
//--------------------------
const startStopButton = document.getElementById('StartStopButton')
const restartButton = document.getElementById('Restart')

startStopButton.addEventListener('click', () => {
    if (startStopButton.className === 'startIcon') {
        startStopButton.className = 'stopIcon'
        restartButton.className = 'disabled'
    } else {
        startStopButton.className = 'startIcon'
        restartButton.className = ''
    }
})

restartButton.addEventListener('click', () => {
    if (restartButton.className === '') {
        console.log('Restart')
    }
})

//--------------------------
// TShark Stream
//--------------------------
const stream = new BehaviorSubject()

tshark.stdio.forEach(io => io.on('data', (data) => {
    const lines = data.toString().split('\n')
    lines.forEach(line => stream.next(line))
}));
tshark.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
});

const objectStream$ = stream
    .scan((acc, line) => {
        if (line && line.startsWith('Frame')) {
        return { Frame: acc }
        }
        if (is(Object, acc)) {
        return line
        }
        return acc + '\n' + line
    }, "")
    .filter(is(Object))
    .map(({ Frame }) => convertToObject(Frame))

const groupOn = (prop, add = always(1)) => (acc = {}, obj) => {
    if (!obj[prop]) return acc
    if (acc[obj[prop]]) {
        return Object.assign(acc, { [obj[prop]]: acc[obj[prop]] + add(obj)})
    } else {
        return Object.assign(acc, { [obj[prop]]: add(obj)})
    }
}

// Convert JS object to an array of objects
const convertToChartData/*: Object => Array<{name: string, value: number}>*/ = pipe(
    toPairs,
    map(([name, value]) => ({ name, value }))
)

//--------------------------
// Body App
//--------------------------
const getPacketSize = obj => parseInt(head((obj['Frame Length'] || "").split(' ')))

const interfaceCounts$ = objectStream$.scan(groupOn('Interface id'), {})
const destinationCounts$ = objectStream$.scan(groupOn('Destination'), {})
const destinationBandwidth$ = objectStream$.scan(groupOn('Destination', getPacketSize), {})
const protocols$ = objectStream$.scan(groupOn('Protocol'), {})


Observable.combineLatest(interfaceCounts$, destinationCounts$, destinationBandwidth$, protocols$)
    .throttleTime(500)
    .subscribe(([interfaceCounts, destinationCounts, destinationBandwidth, protocols]) => {
        const maxDestinationCounts = d3.max(values(destinationCounts))   
        const minDestinationCounts = d3.min(values(destinationCounts))   
        const destinationCountsScale = d3.scale.linear().domain([maxDestinationCounts, minDestinationCounts]).range([0, 100])
        const destinationCountPercentages = map(destinationCountsScale, destinationCounts)
        updateBar(convertToChartData(destinationCountPercentages))
        updatePie(convertToChartData(protocols))
    })





    // debugger;
//   BarChartBack.innerHTML = `
//     <h1>destinationCounts:</h1>
//     <ul>${toPairs(destinationCountPercentages).map(([key, value]) => 
//       `<li style="color: ${hashStringToColor(key)}">${key}: ${value}%</li>`).join('')}
//     </ul>
//   `

    // PieChartBack.innerHTML = `
    //   <h1>Protocols:</h1>
    //   <ul>${toPairs(protocols).map(([key, value]) => 
    //     `<li style="color: ${hashStringToColor(key)}">${key}: ${value}</li>`).join('')}
    //   </ul>
    // `

//   app.innerHTML = `
//   <div>

//     <h1>interfaceCounts:</h1>
//     <ul>${toPairs(interfaceCounts).map(([key, value]) => 
//       `<li style="color: ${hashStringToColor(key)}">${key}: ${value}</li>`).join('')}
//     </ul>

//     <h1>Protocols:</h1>
//     <ul>${toPairs(protocols).map(([key, value]) => 
//       `<li style="color: ${hashStringToColor(key)}">${key}: ${value}</li>`).join('')}
//     </ul>

//     <h1>destinationBandwidth:</h1>
//     <ul>${toPairs(destinationBandwidth).map(([key, value]) => 
//       `<li style="color: ${hashStringToColor(key)}">${key}: ${value}</li>`).join('')}
//     </ul>
//   </div>  
//   // `




