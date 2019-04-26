import ElasticsearchStore from './ElasticsearchStore';
import Graphic from "esri/Graphic";
import { Point } from 'esri/geometry';
import FeatureLayer = require('esri/layers/FeatureLayer');
import Field = require('esri/layers/support/Field');
import MapView = require('esri/views/MapView');

export default class DataProvider{

    getFeatureLayers(appId: string, view: MapView){
        return ElasticsearchStore.getAggregatedSessions(appId).then(response => {
            const graphics = this.toGraphics(response);
            return this.toFeatureLayer(graphics, view);
        });
    }

    toGraphics(data: any){
        return data.sessions.buckets.reduce((graphics: Graphic[], session: Session) => {
            const sessionId = session.key;
            session.events.hits.hits.forEach((event: Event) => {
                const eventProps = event._source;
                graphics.push(new Graphic({
                    attributes: {
                        ObjectID: event._id,
                        sessionId,
                        topic: eventProps.message,
                        scale: eventProps.map_scale,
                        zoom: eventProps.map_zoom,
                        timestamp: eventProps.timestamp,
                    },
                    geometry: new Point(eventProps.map_center)
                }));
            });
            return graphics;
        }, [])
    }

    private toFeatureLayer(source: Graphic[], view: MapView){
        return new FeatureLayer({
            source,
            fields: [
                new Field({
                    name: "ObjectID",
                    alias: "ObjectID",
                    type: "oid"
                }),
                new Field({
                    name: "sessionId",
                    alias: "SessionID",
                    type: "string"
                }),
                new Field ({
                    name: "topic",
                    alias: "Topic",
                    type: "string"
                }),
                new Field ({
                    name: "scale",
                    alias: "Scale",
                    type: "double"
                }),
                new Field ({
                    name: "zoom",
                    alias: "Zoom",
                    type: "double"
                }),
                new Field ({
                    name: "timestamp",
                    alias: "Timestamp",
                    type: "date"
                })
            ]
        });
    }
}

interface Session {
    key: string
    events: any
}

interface Event {
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