export default {
    "appName": "Session Viewer",
    "scenarioA": "Off-Screen Indicator Szenario",
    "scenarioB": "Standard Szenario",
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
        title: "Karteninteraktionen",
        id: "interaction_points"
    },
    "movesLayer": {
        title: "Aggregierte Nutertrajektorien",
        id: "moves"
    },
    taskGeometriesLayer: {
        url: "https://services1.arcgis.com/XRQ58kpEa17kSlHX/arcgis/rest/services/test_mapapps_days/FeatureServer/0",
        id: "task-geometries",
        title: "Hotel Geometrien"
    },
    actions: {
        zoom: "Zoom-Level",
        interactionCount: "Interaktionen seit Sitzungsstart",
        elapsedSessionTime: "Sekunden seit Sitzungsstart",
        totalSessionTime: "Gesamtdauer der Sitzung (s)",
        pragmaticQuality: "Pragmatische Qualität",
        hedonicQuality: "Hedonische Qualität",
        overallExperience: "Insgesamte Qualität",
        zoomDiff: "Zoom-Level Differenz",
        interactionCountMoves: "Anzahl der aggregierten Interaktionen",
    },
    descriptionTexts: {
        start: `
            The 'Session-Viewer' allows you to compare two datasets by interactively working with a set of analytics layer.
            Manipulating a view's extent or layer will automatically synchronize these changes to the opposite view.
            This allows you to apply the same analysis parameters on both datasets and compare the differences.
            To begin, click on one of the layer titles in the upper-left table of contents.
            You can choose between the raw locations of users' "Interactions" or the "Summarized Moves" that show connection between characteristic locations.
            The third and last layer shows the geometries of the participants' task locations and can be used as a reference.
        `,
        interactionSlider: `
            The "Interaction" layer shows the raw locations of users' interactions whereas the color is used for visualizing the value of selected measures.
            You can see and change the selected measures by opening the dot-menu next to the layer's title.
            Measures are split into two categories: Performance and Experience.
            If a single measure is activated, an additional slider widget is displayed in the lower-right corner.
            The slider allows you to control the visualization's breakpoints as well as the theme ("High to Low Values" vs "Above and Below Average").
            You can also choose to visualize the relationship between different measures by selecting two measures from different categories.
        `,
        interactionRelationship: `
            Relationship visualizations allow you to map two patterns within a single map and help you see if two things are related.
            The legend widget in the lower-right corner explains the meaning of the colors in the map.
        `,
        summarizedMoves: `
            The "Summarized Moves" layer shows the aggregated tracks of users sessions whereas the color is used for visualizing the value of selected measures.
            You can see and change the selected measures by opening the dot-menu next to the layer's title.
        `
    }
}
