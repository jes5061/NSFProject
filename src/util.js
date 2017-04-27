import { match, pipe, is, split, map, mergeAll, replace, toPairs, values } from 'ramda'

// convet string to hash
export const djb2 = str => {
    var hash = 5381;
    for (var i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash) + str.charCodeAt(i); /* hash * 33 + c */
    }
    return hash;
}

// convert a string to a color
export const hashStringToColor = str => {
    var hash = djb2(str);
    var r = (hash & 0xFF0000) >> 16;
    var g = (hash & 0x00FF00) >> 8;
    var b = hash & 0x0000FF;
    return "#" + ("0" + r.toString(16)).substr(-2) + ("0" + g.toString(16)).substr(-2) + ("0" + b.toString(16)).substr(-2);
}

export const lineToObj = pipe(
    split(':'),
    ([key = "", value = ""]) => ([ key.trim(), value.trim() ]),
    ([key, value]) => {
        if (key === 'Destination' || key === 'Source'){
        const [_, destination, ip] = match(/(\S+) \(([\d\.]+)\)/, value)
        return { 
            [key]: destination,
            [`${key}ip`]: ip
        }
        } else {
        return { [key]: value }
        }
    }
)

export const convertToObject = pipe(
    replace(/[\[\]]/g, ''),
    split('\n'),
    map(lineToObj),
    mergeAll
)


export const groupOn = prop => (acc = {}, obj) => {
    if (obj === 'restart') return {}
    if (!obj[prop]) return acc
    if (acc[obj[prop]]) {
        return Object.assign(acc, { [obj[prop]]: acc[obj[prop]] + 1})
    } else {
        return Object.assign(acc, { [obj[prop]]: 1})
    }
}

// Convert JS object to an array of objects
export const convertToChartData/*: Object => Array<{name: string, value: number}>*/ = pipe(
    toPairs,
    map(([name, value]) => ({ name, value }))
)