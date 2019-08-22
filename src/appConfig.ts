const locale = "en";

const ui = {
  de: {
    scenarioA: "Off-Screen Indicator Szenario",
    scenarioB: "Standard Szenario",
    interactionLayer: "Karteninteraktionen",
    movesLayer: "Aggregierte Nutzertrajektorien",
    taskGeometriesLayer: "Hotel Standorte",
    fields: {
      zoom: "Zoom-Level",
      interactionCount: "Interaktionen seit Sitzungsstart",
      elapsedSessionTime: "Sekunden seit Sitzungsstart",
      totalSessionTime: "Gesamtdauer der Sitzung (s)",
      pragmaticQuality: "Pragmatische Qualität",
      hedonicQuality: "Hedonische Qualität",
      overallExperience: "Insgesamte Qualität",
      zoomDiff: "Zoom-Level Differenz",
      interactionCountMoves: "Anzahl der aggregierten Interaktionen"
    },
    descriptionTexts: {
      start: `
        Das 'Session-Viewer' ermöglicht den interaktiven Vergleich zweier Datensätze mit Hilfe verschiedener Analyselayer.
        Die Veränderungen an einer Ansicht werden automatisch auf die andere Ansicht synchronisiert (Ausschnitt, aktive Layer).
        Dadurch können Analyseparameter auf beide Datensätze angewendet und verglichen werden.
        Klicken Sie zum Starten auf einen der beiden Layer in der oberen, linken Ecke (Inhaltsbaum).
        Sie können zwischen den "rohen" Position der "Karteninteraktionen" und den "Aggregierten Trajektorien" wählen.
        Der dritte und letzte Layer enthät die Geometrien aus der ursprünglichen Aufgabe und kann als Referenz genutzt werden.
      `,
      interactionSlider: `
        Der Layer "Karteninteraktionen" zeigt die Positionen einzelner Zoom- und Pan-Interaktionen, wobei die Farbe eine zusätzliche Metrik darstellt.
        Diese Metrik können Sie über das Menü unterhalb des Layer-Titels auswählen ("drei Punkte").
        Die verfügbaren Metriken sind dabei in zwei Kategorien unterteil: Effizient und Zufriedenheit.
        Wenn nur eine Metrik aus einer Kategorie aktiviert ist, erscheint ein zusätzlicher Slider-Widget in der unteren rechten Ecke.
        Der Slider ermöglicht eine Veränderung der Klassen für die Visualisierung der Metrik und des Modus ("Niedrig zu Hoch" und "Über und unter").
        Durch die Aktivierung zweier Metriken aus unterschiedlichen Kategorien, können Sie auch deren Beziehung visualisieren.
      `,
      interactionRelationship: `
        Visualisierungen von Beziehungen ermöglichen die Darstellungen zweier Muster in einer Karten und zeigen, ob zwei Dinge in Beziehung stehen.
        Das statische Legendenwidget in der unteren rechten Ecke beschreibt die Bedeutung der Farben in der Karte.
      `,
      aggregatedTracks: `
        Die "Aggregierten Nutzertrajektorien" zeigen zusammengefasste WebGIS Sitzungen, wobei die Farbe die Differenz des Zoom-Level zwischen zwei Punkten darstellt.
        Ein negativer Wert bedeutet, dass der Nutzer sich von der Kartenoberfläche entfernt hat ("herauszoomen").
        Ein positiver Wert bedeutet, dass der Nutzer in die Karte herein gezoomt hat.
      `
    },
    slider: {
      highToLow: "Niedrig zu Hoch",
      aboveAndBelow: "Über und Unter"
    }
  },
  en: {
    scenarioA: "Off-Screen Indicator Scenario",
    scenarioB: "Default Scenario",
    interactionLayer: "Map Interactions",
    movesLayer: "Aggregated User-Trajectories",
    taskGeometriesLayer: "Hotel Locations",
    fields: {
      zoom: "Zoom-Level",
      interactionCount: "User Interaction Count Since Session Start",
      elapsedSessionTime: "Seconds Since Session Start",
      totalSessionTime: "Total Duration of Session (Seconds)",
      pragmaticQuality: "Pragmatic Quality",
      hedonicQuality: "Hedonic Quality",
      overallExperience: "Overall Quality",
      zoomDiff: "Zoom-Level Ratio",
      interactionCountMoves: "Count of Aggregated User Interactions"
    },
    descriptionTexts: {
      start: `
        The 'Session-Viewer' allows you to compare two datasets by interactively working with a set of analytics layer.
        Manipulating a view's extent or layer will automatically synchronize these changes to the opposite view.
        This allows you to apply the same analysis parameters on both datasets and compare the differences.
        To begin, click on one of the layer titles in the upper-left table of contents.
        You can choose between the raw locations of users' "Interactions" or the "Aggregated User-Trajectories" that show connection between characteristic locations.
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
      aggregatedTracks: `
        The "Aggregated User-Trajectories" layer shows the aggregated tracks of users sessions whereas the color is used for visualizing the value of selected measures.
        A negative value means, that the user zoomed out.
        A positive value means, that the user zoomed in.
      `
    },
    slider: {
      highToLow: "High to Low",
      aboveAndBelow: "Above and Below"
    }
  }
};

export default {
  appName: "Session Viewer",
  elasticsearch_url: "http://localhost:9200/mapapps/_search",
  scenarioA: ui[locale].scenarioA,
  scenarioB: ui[locale].scenarioB,
  basemap: "gray",
  initialExtent: {
    xmin: 836278.4172107871,
    ymin: 6779715.988551413,
    xmax: 860700.0477478679,
    ymax: 6804309.602402135,
    spatialReference: {
      wkid: 102100
    }
  },
  appIds: [
    "beispielnutzerstudiecrownhotels",
    "beispielnutzerstudiedefaulthotels"
  ],
  interactionLayer: {
    title: ui[locale].interactionLayer,
    id: "interaction_points"
  },
  movesLayer: {
    title: ui[locale].movesLayer,
    id: "moves"
  },
  taskGeometriesLayer: {
    url:
      "https://services1.arcgis.com/XRQ58kpEa17kSlHX/arcgis/rest/services/test_mapapps_days/FeatureServer/0",
    id: "task-geometries",
    title: ui[locale].taskGeometriesLayer
  },
  fields: {
    zoom: ui[locale].fields.zoom,
    interactionCount: ui[locale].fields.interactionCount,
    elapsedSessionTime: ui[locale].fields.elapsedSessionTime,
    totalSessionTime: ui[locale].fields.totalSessionTime,
    pragmaticQuality: ui[locale].fields.pragmaticQuality,
    hedonicQuality: ui[locale].fields.hedonicQuality,
    overallExperience: ui[locale].fields.overallExperience,
    zoomDiff: ui[locale].fields.zoomDiff,
    interactionCountMoves: ui[locale].fields.interactionCountMoves
  },
  descriptionTexts: {
    start: ui[locale].descriptionTexts.start,
    interactionSlider: ui[locale].descriptionTexts.interactionSlider,
    interactionRelationship:
      ui[locale].descriptionTexts.interactionRelationship,
    aggregatedTracks: ui[locale].descriptionTexts.aggregatedTracks
  },
  slider: {
    "high-to-low": ui[locale].slider.highToLow,
    "above-and-below": ui[locale].slider.aboveAndBelow,
    zoom: {
      minValue: 11,
      maxValue: 21,
      numBins: 11
    },
    interactionCount: {
      minValue: 0,
      maxValue: 69,
      numBins: 10
    },
    elapsedSessionTime: {
      minValue: 0,
      maxValue: 312,
      numBins: 10
    },
    pragmaticQuality: {
      minValue: 1,
      maxValue: 7,
      numBins: 7
    },
    hedonicQuality: {
      minValue: 1,
      maxValue: 7,
      numBins: 7
    },
    overallExperience: {
      minValue: 1,
      maxValue: 7,
      numBins: 7
    },
    zoomDiff: {
      minValue: -4,
      maxValue: 6,
      numBins: 11
    },
    interactionCountMoves: {
      minValue: 1,
      maxValue: 8,
      numBins: 8
    }
  }
};
