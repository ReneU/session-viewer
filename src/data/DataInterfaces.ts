export interface Session {
    key: string
    events: any
}

export interface Event {
    _id: String
    _source: Source
}

interface Source {
    message: string,
    map_scale: number,
    map_zoom: number,
    timestamp: number,
    map_center: Object
}