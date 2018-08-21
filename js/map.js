
if (typeof sit === "undefined") {
    var sit = {};
}

sit.initMap = function () {

    var swissProjection = new ol.proj.Projection({
        code: 'EPSG:2056',
        extent: [485869.5728, 76443.1884, 837076.5648, 299941.7864],
        units: 'm'
    });

    ol.proj.addProjection(swissProjection);

    var mapProjection = swissProjection;
    mapProjection.setExtent([485869.5728, 76443.1884, 837076.5648, 299941.7864]);


    var wmsLayer = new ol.layer.Image({
        source: new ol.source.ImageWMS({
            url: sit.wms,
            params: {
                'LAYERS': sit.wmslayers,
            },
            serverType: /** @type {ol.source.wms.ServerType} */ ('mapserver')
        }),
        opacity: 0.9
    });

    var overlayStyle = [
        new ol.style.Style({
            fill: new ol.style.Fill({ color: [255, 255, 255, 0.5] })
        }),
        new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: [255, 255, 255, 1], width: 3.5
            })
        }),
        new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: [0, 153, 255, 1], width: 10
            })
        })
    ];

    sit.geojsonLayer = new ol.layer.Vector({
        opacity: 0,
        source: new ol.source.Vector({
        }),
        style: overlayStyle
    });

    for (var i=0; i<sit.wmslayers.length;i++) {
      var singlelayer = sit.wmslayers[i];
      var featureRequest = new ol.format.WFS().writeGetFeature({
          srsName: sit.mapCRS,
          featureNS: 'mapnv.ch',
          featurePrefix: 'gmf_',
          featureTypes: [singlelayer],
          outputFormat: 'geojson',
      });

      // then post the request and add the received features to a layer
      fetch(sit.wms, {
          method: 'POST',
          body: new XMLSerializer().serializeToString(featureRequest)
      }).then(function(response) {
          return response.json();
      }).then(function(json) {

          var gJson = new ol.format.GeoJSON();
          var feats = [];
          for (var i=0; i < json.features.length; i++) {
            feats.push(gJson.readFeature(json.features[i]));
          }
          sit.geojsonLayer.getSource().addFeatures(feats)

      });
    };

    var selectSingleClick = new ol.interaction.Select({
         condition: ol.events.condition.selectSingleClick
     });

     var selectPointerMove = new ol.interaction.Select({
          condition: ol.events.condition.pointerMove
      });

     selectSingleClick.on('select', function(e) {

       if (selectSingleClick.getFeatures().array_.length > 0) {

          $('#info').show();
          var v = selectSingleClick.getFeatures().array_[0].values_
          var html = '<b>Nom:</b> ' + v.nom + '<br>' ;
          html += '<b>Commune:</b> ' + v.commune + '<br>';
          html += '<b>État:</b> ' + v.etat + '<br>';
          html += '<b>Type:</b> ' + v.type + '<br>';
          html += '<b>Lien:</b> ' + v.link + '<br>';
          $('#info')[0].innerHTML = html;
      } else {
        $('#info').hide();
      }
   });

    var asitVDResolutions = [4000, 3750, 3500, 3250, 3000, 2750, 2500, 2250, 2000, 1750, 1500, 1250, 1000, 750, 650, 500, 250, 100, 50, 20, 10, 5, 2.5, 2, 1.5, 1, 0.5];
    var matrixIds = asitVDResolutions.map((value, index) => index);

    var tileGrid = new ol.tilegrid.WMTS({
        resolutions: asitVDResolutions,
        matrixIds: matrixIds,
        extent: [2420000, 130000, 2900000, 1350000]
    });

    var wmtsSource =  new ol.source.WMTS( /** @type {olx.source.WMTSOptions} */({
        attributions: 'mapnv.ch - géodonnées &copy; Etat de Vaud & &copy; contributeurs OpenStreetMap',
        url: 'https://ows{1-4}.asitvd.ch/wmts/1.0.0/{Layer}/default/default/0/' +
        '2056/{TileMatrix}/{TileRow}/{TileCol}.png',
        projection: 'EPSG:2056',
        requestEncoding: 'REST',
        layer: sit.wmtsLayer,
        style: 'default',
        matrixSet: '2056',
        format: 'image/png',
        tileGrid: tileGrid
    }));

    var wmtsLayer = new ol.layer.Tile({
        source: wmtsSource,
        opacity: 1
    })

    // var attributionControl = new ol.control.Attribution();

    sit.map = new ol.Map({
        controls: [
            new ol.control.ScaleLine(),
            new ol.control.Zoom(),
            new ol.control.Attribution()
        ],
        target: 'map',
        layers: [wmtsLayer, wmsLayer, sit.geojsonLayer],
        view: new ol.View({
            projection: mapProjection,
            center: [2538812, 1181380],
            minZoom: 4,
            maxZoom: 27,
            zoom: sit.initialZoom,
            extent: sit.mapExtent
        })
    });

	sit.map.addInteraction(selectPointerMove);
  sit.map.addInteraction(selectSingleClick);

}
