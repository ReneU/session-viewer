export default {
    "appName": "Session Viewer",
    "scenarioA": "With Off-Screen Indicators",
    "scenarioB": "Without Off-Screen Indicators",
    "basemap": "dark-gray",
    "initialExtent":  {
        "xmin":836278.4172107871,
        "ymin":6779715.988551413,
        "xmax":860700.0477478679,
        "ymax":6804309.602402135,
        "spatialReference":{
        "wkid":102100
        }
    },
    "appIds": ["beispielnutzerstudiecrownhotels", "beispielnutzerstudiedefaulthotels"],
    "interactionLayer": {
        title: "Interactions",
        id: "interaction_points"
    },
    "characteristicsLayer": {
        title: "Characteristic Points",
        id: "Characteristic Points"
    },
    "trajectoriesLayer": {
        title: "Trajectories",
        id: "trajectories"
    },
    "clusterLayer": {
        title: "Cluster",
        id: "cluster"
    },
    taskGeometriesLayer: {
        url: "https://services1.arcgis.com/XRQ58kpEa17kSlHX/arcgis/rest/services/test_mapapps_days/FeatureServer/0",
        id: "task-objects",
        title: "Task Geometries"
    }
}
