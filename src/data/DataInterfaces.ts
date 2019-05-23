import { Point } from 'esri/geometry';
import SpatialReference from 'esri/geometry/SpatialReference';

export interface ElasticResponse {
    sessions: ElasticSessions
}

interface ElasticSessions {
    buckets: EsSession[]
}

export interface EsSession {
    key: string
    events: any
}

export interface EsEvent {
    _id: string
    _source: EsSource
}

interface EsSource {
    message: string,
    map_scale: number,
    map_zoom: number,
    timestamp: number,
    map_center: Point
}

export interface Session {
    id: string,
    events: SessionEvent[]
}

export interface SessionEvent {
    attributes: EventAttributes,
    geometry: EventGeometry
}

export interface EventAttributes {
    zoom: number,
    topic: string,
    scale: number,
    ObjectID: string,
    sessionId: string,
    totalSessionTime: number
    interactionCount: number,
    elapsedSessionTime: number,
    lastInteractionDelay: number,
}

interface EventGeometry {
    x: number,
    y: number,
    spatialReference: SpatialReference
}