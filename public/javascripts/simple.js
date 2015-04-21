var map = new ol.Map({
  view: new ol.View({
    center: [0, 0],
    zoom: 1
  }),
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM()
    })
  ],
  target: 'map'
});

var source = new ol.source.Vector();
var originLayer = new ol.layer.Vector();
var smallLayer = new ol.layer.Vector();
var bigLayer = new ol.layer.Vector();
var gridLayer = new ol.layer.Vector();
