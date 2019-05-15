import ElasticsearchStore from './ElasticsearchStore';
import {Session, Event} from "./DataInterfaces";

import FeatureLayer from 'esri/layers/FeatureLayer';
import Field from 'esri/layers/support/Field';
import MapView from 'esri/views/MapView';
import { Point } from 'esri/geometry';
import Graphic from "esri/Graphic";

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
            let sessionStartDate: number;
            session.events.hits.hits.forEach((event: Event, i: number) => {
                const eventProps = event._source;
                const sessionTime = sessionStartDate ? eventProps.timestamp - sessionStartDate : 0;
                graphics.push(new Graphic({
                    attributes: {
                        ObjectID: event._id,
                        sessionId,
                        interactionCount: i,
                        topic: eventProps.message,
                        scale: eventProps.map_scale,
                        zoom: eventProps.map_zoom,
                        sessionTime
                    },
                    geometry: new Point(eventProps.map_center)
                }));
                if(i === 0){
                    sessionStartDate = eventProps.timestamp;
                }
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
                    name: "interactionCount",
                    alias: "InteractionCount",
                    type: "double"
                }),
                new Field ({
                    name: "sessionTime",
                    alias: "SessionTime",
                    type: "double"
                })
            ]
        });
    }
}