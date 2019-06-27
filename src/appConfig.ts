export default {
  appName: "Session Viewer",
  scenarioA: "Off-Screen Indicator Szenario",
  scenarioB: "Standard Szenario",
  basemap: "dark-gray",
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
    title: "Karteninteraktionen",
    id: "interaction_points"
  },
  movesLayer: {
    title: "Aggregierte Nutzertrajektorien",
    id: "moves"
  },
  taskGeometriesLayer: {
    url:
      "https://services1.arcgis.com/XRQ58kpEa17kSlHX/arcgis/rest/services/test_mapapps_days/FeatureServer/0",
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
            Der Slider ermöglicht eine Veränderung der Klassen für die Visualisierung der Metrik und des Modus ("Niedrige zu Hohen Werten" und "Über und unter Durchschnitt").
            Durch die Aktivierung zweier Metriken aus unterschiedlichen Kategorien, können Sie auch deren Beziehung visualisieren.
        `,
    interactionRelationship: `
            Visualisierungen von Beziehungen ermöglichen die Darstellungen zweier Muster in einer Karten und zeigen, ob zwei Dinge in Beziehung stehen.
            Das statische Legendenwidget in der unteren rechten Ecke beschreibt die Bedeutung der Farben in der Karte.
        `,
    summarizedMoves: `
            Die "Aggregierten Nutzertrajektorien" zeigen zusammengefasste WebGIS Sitzungen, wobei die Farbe die Differenz des Zoom-Level zwischen zwei Punkten darstellt.
            Ein negativer Wert bedeutet, dass der Nutzer sich von der Kartenoberfläche entfernt hat ("herauszoomen").
            Ein positiver Wert bedeutet, dass der Nutzer in die Karte herein gezoomt hat.
        `
  }
};
