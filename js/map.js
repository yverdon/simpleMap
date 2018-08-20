
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


    // var mapProjection = ol.proj.get(sit.mapCRS);
    // mapProjection.setExtent([2531872, 1191280, 2550332, 1176940]);

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

    sit.geojsonLayer = new ol.layer.Vector({
        opacity: 1,
        source: new ol.source.Vector({
        })
    });

    var featureRequest = new ol.format.WFS().writeGetFeature({
        srsName: sit.mapCRS,
        featureNS: 'mapnv.ch',
        featurePrefix: 'gmf_',
        featureTypes: sit.wmslayers,
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

    var selectPointerMove = new ol.interaction.Select({
         condition: ol.events.condition.selectSingleClick
         // condition: ol.events.condition.pointerMove
     });

     selectPointerMove.on('select', function(e) {

       if (selectPointerMove.getFeatures().array_.length > 0) {

          $('#info').show();
          var v = selectPointerMove.getFeatures().array_[0].values_
          var html = 'Nom: ' + v.nom + '<tr>' ;
          html += 'Commune: ' + v.commune + '<tr>';
          html += 'État: ' + v.etat + '<tr>';
          html += 'Type: ' + v.type + '<tr>';
          html += 'Lien: ' + v.link + '<tr>';
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
        attributions: 'géodonnées &copy; Etat de Vaud & &copy; contributeurs OpenStreetMap',
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

    sit.map = new ol.Map({
        controls: [
            new ol.control.ScaleLine(),
            new ol.control.Zoom()
        ],
        interactions: [selectPointerMove],
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

    // sit.map.on('singleclick', function(evt) {
    //
    //     // document.getElementById('info').innerHTML = '';
    //     // var viewResolution = /** @type {number} */ (sit.map.getView().getResolution());
    //     // var url = wmsLayer.getSource().getGetFeatureInfoUrl(
    //     //   evt.coordinate, viewResolution, sit.mapCRS,
    //     //   {'INFO_FORMAT': 'application/json'}
    //     // );
    //     // console.log(url);
    //     // $.ajax({
    //     //     type: "GET",
    //     //     url: url,
    //     //     dataType: "application/json",
    //     //     success: function(response) {
    //     //         console.log(response);
    //     //
    //     //     }
    //     // });
    //     // generate a GetFeature request
    //     var featureRequest = new ol.format.WFS().writeGetFeature({
    //         srsName: sit.mapCRS,
    //         featureNS: 'mapnv.ch',
    //         featurePrefix: 'gmf_',
    //         featureTypes: sit.wmslayers,
    //         outputFormat: 'geojson',
    //         // filter: ol.format.filter.Intersects('geom', new ol.geom.Point(evt.coordinate), sit.mapCRS),
    //         // filter: andFilter(
    //         // likeFilter('name', 'Mississippi*'),
    //         // equalToFilter('waterway', 'riverbank')
    //         // )
    //     });
    //
    //     // then post the request and add the received features to a layer
    //     fetch(sit.wms, {
    //         method: 'POST',
    //         body: new XMLSerializer().serializeToString(featureRequest)
    //     }).then(function(response) {
    //         return response.json();
    //     }).then(function(json) {
    //         var features = new GeoJSON().readFeatures(json);
    //          sit.geojsonLayer.getSource().clear()
    //          sit.geojsonLayer.getSource().addFeatures(features)
    //     });
    //
    //
    //
    //     // if (url) {
    //         // $.ajax({
    //             // type: "GET",
    //             // url: url,
    //             // dataType: "jsonp xml",
    //             // success: function(response) {
    //                 // console.log(response);
    //                  // var vectorSource = new ol.source.VectorSource({
    //                     // format: new ol.format.WFS(),
    //                     // url: url
    //                 // });
    //                 // console.log(vectorSource.getFeatures())
    //
    //             // }
    //         // });
    //
    //
    //     // }
    // });

}
