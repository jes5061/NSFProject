import BarChart from './components/BarChart'
import PieChart from './components/PieChart'     
import { spawn } from 'child_process' // allows you to run commands on command line
import { BehaviorSubject, Observable } from 'rxjs' // reactive progamming, streams
import { match, pipe, is, split, map, mergeAll, replace, toPairs, values } from 'ramda' //functional programming
import { djb2, hashStringToColor, lineToObj, convertToObject, convertToChartData, groupOn } from './util' // util

const tshark = spawn('tshark', ['-V']) // runs tshark at command line
const updateBar = BarChart("#BarChart") // references to update BarChart
const updatePie = PieChart("#PieChart") // references to update PieChart

//--------------------------
// Start / Stop buttons
//--------------------------
const startStopButton = document.getElementById('StartStopButton')
const restartButton = document.getElementById('Restart')
const startButtonClicked$ = new BehaviorSubject('start')
const restartButtonClicked$ = new BehaviorSubject('restart')

startStopButton.addEventListener('click', () => {
    if (startStopButton.className === 'startIcon') {
        startButtonClicked$.next('start')
        startStopButton.className = 'stopIcon'
        restartButton.className = 'disabled'
    } else {
        startButtonClicked$.next('stop')
        startStopButton.className = 'startIcon'
        restartButton.className = ''
    }
})

restartButton.addEventListener('click', () => {
    if (restartButton.className === '') {
        restartButtonClicked$.next('restart')
    }
})

//--------------------------
// TShark Stream
//--------------------------
let stopped = false 
const tsharkstream$ = new BehaviorSubject()
tshark.stdio.forEach(io => io.on('data', (data) => {
    const lines = data.toString().split('\n')
    lines.forEach(line => tsharkstream$.next(line))
}))
tshark.on('close', (code) => {
    console.log(`child process exited with code ${code}`)
})

const objectStream$ = Observable.merge(tsharkstream$, startButtonClicked$)
    .scan((acc, line) => {
       if (line === 'start') {
            stopped = false
            return acc || ""
        }
        if (line === 'stop' || stopped) {
            stopped = true
            return acc || ""
        } 
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


//--------------------------
// Body App
//--------------------------
const destinationCounts$ = Observable
    .merge(objectStream$, restartButtonClicked$)
    .scan(groupOn('Destination'), {})
    .throttleTime(500)
    .subscribe(destinationCounts => {
        const maxDestinationCounts = d3.max(values(destinationCounts))   
        const minDestinationCounts = d3.min(values(destinationCounts))   
        const destinationCountsScale = d3.scale.linear().domain([maxDestinationCounts, minDestinationCounts]).range([0, 100])
        const destinationCountPercentages = map(destinationCountsScale, destinationCounts)
        updateBar(convertToChartData(destinationCountPercentages))
    })

const protocols$ = Observable
    .merge(objectStream$, restartButtonClicked$)
    .scan(groupOn('Protocol'), {})
    .throttleTime(500)
    .subscribe(protocols => updatePie(convertToChartData(protocols)))