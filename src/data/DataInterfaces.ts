import SpatialReference from 'esri/geometry/SpatialReference';
import Circle from 'esri/geometry/Circle';
import { Point } from 'esri/geometry';

export interface EsResponse {
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
    map_center: Point,
    supportive: number,
    easy: number,
    efficient: number,
    clear: number,
    exciting: number,
    interesting: number,
    inventive: number,
    leadingEdge: number
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
    pragmaticQuality: number,
    hedonicQuality: number,
    overallExperience: number
}

interface EventGeometry {
    x: number,
    y: number,
    spatialReference: SpatialReference
}

export interface Cluster {
    circle: Circle,
    attributes: ClusterAttributes
}

interface ClusterAttributes {
    scale: number,
    zoom: number
}

export interface Move {
    start: Cluster,
    end: Cluster,
    count: number
}

export interface Track {
    type: string,
    paths: any[],
    spatialReference: SpatialReference,
    attributes: TrackAttributes
}

interface TrackAttributes {
    topic: string,
    ObjectID: string,
    sessionId: string,
    interactionCount: number,
    startZoom: number,
    endZoom: number,
    zoomDiff: number,
    elapsedSessionTime: number,
    startScale: number,
    endScale: number,
    scaleDiff: number,
    lastInteractionDelay: number,
    totalSessionTime: number
}