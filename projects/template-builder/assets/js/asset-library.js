var app = app || {};

// Required to use _$ instead of $ to do a multiple versions of jquery being loaded.
// jQueryConflict is set in the utils file

_$(document).ready(function() {

    app.Categories = null;
    app.tags = null;
    app.assetType = "S";
    app.assetTheme = null;

    app.al = {
        initAssetLibrary: function() {
            app.al.bindAssetLibraryDOMEvents();
            var BaseUrl;
            if (!app.isLocalEnv && typeof(app.isLocalEnv) !== 'undefined') {
                BaseUrl = globalUrls.assetBaseUrl;
            }
        },

        /**
        DOM MANIPULATION
        **/
        toggleAssetLibFeatures: function() {
            var _$this = _$(this),
                targetElId = _$this.data('targetid');

            _$('[data-id=' + targetElId + ']').removeClass('hidden').siblings('div').addClass('hidden');
        },
        /**
        UI HANDLERS
        **/
        bindAssetLibraryDOMEvents: function() {
            _$('[data-action=toggle-asset-lib-functions]').on('click', app.al.toggleAssetLibFeatures);
            _$('[data-action=search-asset-lib]').on('click', function(event) { app.al.searchAssets("lib"); });
            _$('[data-action=search-asset-prod]').on('click', function(event) { app.al.searchAssets("prod"); });
            _$('[data-action=init-add-new-asset]').on('click', app.al.LoadPopup);
        },
        SetThemes: function() {

            if (app.Categories == null) {
                _$.get(BaseUrl + "AssetTheme.ashx", function(data, status) {

                        app.Categories = app.al.ExtractJSON(data);

                        var html = app.al.CreateDropDown(app.Categories, "AssetThemeId", "ThemeName");

                        app.assetTheme = app.Categories[0]["AssetThemeId"];

                        _$("#themes").append(html);
                    }
                );
            } else {
                var html = app.al.CreateDropDown(app.Categories, "AssetThemeId", "ThemeName");
                _$("#themes").append(html);
            }
        },
        CreateDropDown: function(Vals, KeyField, ValueField) {
            var Html = '<select class="form-control" id="themesList">';
            var Option = "<option value={0}>{1}</option>";

            for (var i = 0; i < Vals.length; i++) {

                Html += Option.replace("{0}", Vals[i][KeyField]).replace("{1}", Vals[i][ValueField]);
            }

            return Html += "</select>"
        },
        LoadPopup: function() {

            console.log('load upload');

            _$.colorbox({
                href: "AddAsset.html",
                scrolling: false,
                onOpen: function() {
                    // make the overlay visible and re-add all it's original properties!
                    _$('#cboxOverlay').css({
                        'visibility': 'visible',
                        'opacity': 1,
                        'cursor': 'pointer'
                    });
                    _$('#colorbox').css({ 'visibility': 'visible' }).fadeIn(1000);
                },
                onComplete: function() {
                    _$(this).colorbox.resize();
                    app.al.SetupSave();
                }
            });
            //_$(".ajax").colorbox();
        },
        ExtractJSON: function(value) {

            var JSONString = value.substring(0, value.lastIndexOf(']') + 1);
            return _$.parseJSON(JSONString);
        },
        GetAssetTypeString: function(typeId) {

            if (typeId == "1") {
                return "Silhouette";
            }
            return "Headline";
        },
        LoadUsage: function(id) {

            _$.ajax({
                url: BaseUrl + "Asset.ashx",
                type: "get", //send it through get method
                data: { cmd: "assetUsage", assetId: id },
                success: function(response) {

                    console.log("asset usage: " + response);

                    var results = app.al.ExtractJSON(response);

                    var htmlList = app.al.BuildAssetUsage(results);

                    _$.colorbox({
                        html: htmlList,
                        scrolling: false,
                        onOpen: function() {
                            // make the overlay visible and re-add all it's original properties!
                            _$('#cboxOverlay').css({
                                'visibility': 'visible',
                                'opacity': 1,
                                'cursor': 'pointer'
                            });
                            _$('#colorbox').css({ 'visibility': 'visible' }).fadeIn(1000);
                        },
                        onComplete: function() {
                            _$(this).colorbox.resize();
                            app.al.SetupSave();
                        }
                    });
                }
            });

            console.log("loading usage: " + id);
        },
        BuildAssetUsage: function(data) {

            //    var thumbPath = '/be/SharedAssets/th1/';
            var resultsString = '<ul id="asset-lib-item-list" class="clearfix list-group">';

            // For each result, create a list item that can be used by the user to select the image asset
            _$.each(data, function(key, value) {
                resultsString += '<li class="list-group-item">';
                resultsString += '<label for="item_' + value.ItemId + '" class="asset-lib-label"></label>';
                resultsString += '<span class="asset-lib-item-name">Product Item ' + value.Description + '</span>';
                resultsString += '<span class="asset-lib-item-name">Product Id ' + value.ProductId + '</span>';
                resultsString += '<span class="asset-lib-item-name">CreatedOn ' + value.CreatedOn + '</span>';
                resultsString += '<span class="asset-lib-item-name">Job Usage ' + value.JobUsage + '</span>';
                resultsString += '';
                resultsString += '</li>';
            });

            return resultsString += "</ul>";
        },
        BuildAssetQuickGrid: function(results) {

            var thumbPath = globalUrls.smallThumbFolder;
            var resultsString = "";

            // For each result, create a list item that can be used by the user to select the image asset
            _$.each(results, function(key, value) {
                resultsString += '<li class="list-group-item">';
                resultsString += '<input type="checkbox" name="block-asset-item" id="asset_' + value.AssetId + '" ';
                resultsString += 'class="hidden asset-lib-selection-checkbox" value="' + value.AssetId + '">';
                resultsString += '<label for="asset_' + value.AssetId + '" class="asset-lib-label">';
                resultsString += '<img src="' + thumbPath + value.AssetId + '.jpg" alt="Asset ' + value.AssetId + '" class="asset-lib-thumb">';
                resultsString += '<span class="asset-lib-item-name">Asset ' + value.AssetId + '</span>';
                resultsString += '</label>';
                resultsString += '</li>';
            });

            return resultsString;
        },
        BuildAssetGrid: function(results) {

            console.log('in table build');

            var Html = "";

            var TableHeader = '<table class="table asset-lib-search-results-table"> ' +
                '<tr>' +
                '   <th>Image</th>' +
                '   <th>Image Title</th>' +
                '   <th>ID</th>' +
                '   <th>Type</th>' +
                '   <th>Category</th>' +
                '   <th>Usage</th>' +
                '   <th>Date Added</th>' +
                '   <th>Functions</th>' +
                '</tr>';

            var RowTemplate = '<tr>' +
                '   <td>' +
                '       <input type="checkbox" id="asset_id1">' +
                '       <label for="asset_id1">' +
                '           <img src="' + globalUrls.smallThumbFolder + '{6}.jpg" alt="Asset title">' +
                '       </label>' +
                '   </td>' +
                '   <td>{0}</td>' +
                '   <td>{1}</td>' +
                '   <td>{2}</td>' +
                '   <td>{3}</td>' +
                '   <td><a href="#" onclick="app.al.LoadUsage({1})">{4}</a></td>' +
                '   <td>{5}</td>' +
                '   <td>' +
                '       <button type="button" class="btn btn-default" data-action="asset-functions" data-assetid="1">Replace</button>' +
                '   </td>' +
                '</tr>';

            for (var i = 0; i < results.length; i++) {

                var NewRow = RowTemplate.toString();

                NewRow = NewRow.replace("{0}", results[i].Name);
                NewRow = NewRow.replace("{1}", results[i].AssetId).replace("{1}", results[i].AssetId);
                NewRow = NewRow.replace("{2}", results[i].Type);
                NewRow = NewRow.replace("{3}", results[i].Category);
                NewRow = NewRow.replace("{4}", results[i].Usage);
                NewRow = NewRow.replace("{5}", results[i].DateAdded);
                NewRow = NewRow.replace("{6}", results[i].AssetId);

                Html += NewRow;
            }

            return TableHeader + Html + '</table>';
        },
        SetupSave: function() {

            app.al.SetThemes();

            //***************     ASSET CREATE  ***************************
            _$('#btnFileUpload').fileupload({
                url: BaseUrl + "Asset.ashx",
                dataType: 'json',
                //formData: { tags: string },
                add: function(e, data) {
                    var that = this;

                    _$.blueimp.fileupload.prototype.options.add.call(that, e, data);

                    app._$body.on('click', '#btnSave', function() {

                        data.submit();

                    });
                },
                error: function(e) {
                    console.log(e);
                    if (e.status === 200) {
                        alert('Asset Saved');
                        /*
                        Add a form reset function
                        */
                    } else {
                        alert('Asset upload failed');
                    }
                },
                success: function() {
                    alert('Asset Saved');
                    /*
                    Add a form reset function
                    */
                }
            }).bind('fileuploadsubmit', function(e, data) {
                console.log('event has fired');
                data.formData = { tags: app.tags, type: app.assetType, theme: app.assetTheme };
            });
            app._$body.on('keyup', '#txtTag', function() {
                app.tags = _$(this).val();
            });
            app._$body.on('change', 'input:radio[name=AssetType]', function() {
                app.assetType = _$(this).val();
            });
            app._$body.on('change', '#themes', function() {
                app.assetTheme = _$(this).find('option:selected').val();
            });
        },
        searchAssets: function(Populate) {

            var SearchTitleTagID = _$('#search-text').val();
            var SearchType = _$('#search-type').val();
            var SearchCategory = _$('#searchCategory').val();

            if (SearchCategory === undefined)
                SearchCategory = _$('#pdfItemAdmin1_searchCategory option:selected').val();

            _$.ajax({
                url: BaseUrl + "Asset.ashx",
                type: "get", //send it through get method
                data: { ttid: SearchTitleTagID, t: SearchType, c: SearchCategory },
                success: function(response) {

                    var results = app.al.ExtractJSON(response);

                    if (Populate == "lib") {

                        var GridData = app.al.BuildAssetGrid(results);
                        _$("#grid").empty().append(GridData);
                    } else {

                        console.log('populate prod grid');
                        var QuickGridData = app.al.BuildAssetQuickGrid(results);
                        _$('#assetsFound #asset-lib-item-list').empty().append(QuickGridData);
                        _$('[data-action=save-block-assets').removeClass('hidden');
                    }
                }
            });
        }
    };

    app.al.initAssetLibrary();
});