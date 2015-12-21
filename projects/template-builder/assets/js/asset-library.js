var app = app || {};
$(document).ready(function () {

    app.Categories = null;

    app.al = {

        initAssetLibrary: function () {
            app.al.bindAssetLibraryDOMEvents();
        },

        /**
        DOM MANIPULATION
        **/
        toggleAssetLibFeatures: function () {
            var $this = $(this),
                targetElId = $this.data('targetid');

            $('[data-id=' + targetElId + ']').removeClass('hidden').siblings('div').addClass('hidden');
        },


        /**
        UI HANDLERS
        **/
        bindAssetLibraryDOMEvents: function () {
            $('[data-action=toggle-asset-lib-functions]').on('click', app.al.toggleAssetLibFeatures);
            $('[data-action=search-asset-lib]').on('click', app.al.searchAssets);
        },
        ExtractJSON: function (value) {

            var JSONString = value.substring(0, value.lastIndexOf(']') + 1);
            return $.parseJSON(JSONString);
        },
        
        /*,
        GetCategoryString: function (catId) {

            if (app.Categories == null) {
                $.ajax({
                    url: BaseUrl + "AssetTheme.ashx",
                    type: "get",
                    success: function (response) {
                        Categories = response;
                    }
                });
            }
            
            if (app.Categories == null) {
                
                for(var i = 0;i<app.Categories)            
            }
        }*/
        GetAssetTypeString: function (typeId) {

            if (typeId == "1") {
                return "Silhouette";
            }
            return "Headline";
        },
        AssetsSearchResults: function (results) {

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
                        '           <img src="../../SharedAssets/th1/{6}.jpg" alt="Asset title">' +
                        '       </label>' +
                        '   </td>' +
                        '   <td>{0}</td>' +
                        '   <td>{1}</td>' +
                        '   <td>{2}</td>' +
                        '   <td>{3}</td>' +
                        '   <td>{4}</td>' +
                        '   <td>{5}</td>' +
                        '   <td>' +
                        '       <button type="button" class="btn btn-default" data-action="asset-functions" data-assetid="1">Replace</button>' +
                        '   </td>' +
                        '</tr>';

            for (var i = 0; i < results.length; i++) {

                var NewRow = RowTemplate.toString();

                NewRow = NewRow.replace("{0}", results[i].Name);
                NewRow = NewRow.replace("{1}", results[i].AssetId);
                NewRow = NewRow.replace("{2}", results[i].Type);
                NewRow = NewRow.replace("{3}", results[i].Category);
                NewRow = NewRow.replace("{4}", results[i].Usage);
                NewRow = NewRow.replace("{5}", results[i].DateAdded);
                NewRow = NewRow.replace("{6}", results[i].AssetId);

                Html += NewRow;
            }

            return TableHeader + Html + '</table>';
        },
        searchAssets: function () {

            var SearchTitleTagID = $('#search-text').val();
            var SearchType = $('#search-type').val();
            var SearchCategory = $('#search-category').val();

            $.ajax({
                url: BaseUrl + "Asset.ashx",
                type: "get", //send it through get method
                data: { ttid: SearchTitleTagID, t: SearchType, c: SearchCategory },
                success: function (response) {

                    console.log(response);

                    var results = app.al.ExtractJSON(response);
                    console.log('res: ' + results);

                    var vals = app.al.AssetsSearchResults(results);

                    $("#grid").empty().append(vals);



                    if (response.substr(0, 1) == "[") {
                        var data = response.substr(0, response.lastIndexOf("]") + 1);
                        dataObj = JSON.parse(data),
                    $searchResults = $('#assetsFound #asset-lib-item-list'),
                    resultsString = '';

                        // Empty the Search results
                        $searchResults.empty();

                        var thumbPath = '/be/SharedAssets/th1/';

                        // For each result, create a list item that can be used by the user to select the image asset
                        $.each(dataObj, function (key, value) {
                            resultsString += '<li class="list-group-item">';
                            resultsString += '<input type="checkbox" name="block-asset-item" id="asset_' + value.AssetId + '" ';
                            resultsString += 'class="hidden asset-lib-selection-checkbox" value="' + value.AssetId + '">';
                            resultsString += '<label for="asset_' + value.AssetId + '" class="asset-lib-label">';
                            resultsString += '<img src="' + thumbPath + value.AssetId + '.jpg" alt="Asset ' + value.AssetId + '" class="asset-lib-thumb">';
                            resultsString += '<span class="asset-lib-item-name">Asset ' + value.AssetId + '</span>';
                            resultsString += '</label>';
                            resultsString += '</li>';
                        });
                        // Append results to the list
                        $searchResults.append(resultsString);
                    } else {
                        alert('no data returned...');
                    }
                }
            });
        }

    };

    // Refactor the code below and add it to the app.ap object.

    app.al.initAssetLibrary();

    var BaseUrl;

    // 
    if (!app.isLocalEnv) {
        BaseUrl = globalUrls.assetBaseUrl;
    }

    //***************     ASSET CREATE  ***************************
    $('#btnFileUpload').fileupload({
        url: BaseUrl + "Asset.ashx",
        dataType: 'json',
        //formData: { tags: string },
        add: function (e, data) {
            var that = this;

            $.blueimp.fileupload.prototype.options.add.call(that, e, data);

            $("#btnSave").on('click', function () {
                console.log(string);
                data.submit();
            });
        },
        error: function (e, data) {
            console.log(e);
            console.log(data);
        }
    }).bind('fileuploadsubmit', function (e, data) {
        console.log('event has fired');
        data.formData = { tags: string };
    });

    $('#txtTag').on('keyup', function () {
        string = $(this).val();
    });

    //***************     ASSET SEARCH  ***************************
    $('#btnSearchAssets').on('click', function () {
        var fileName = $('#txtSearchFilename').val(),
            tags = $('#txtSearchTags').val();

        if (app.isLocalEnv) {
            // Show the 'Save assets' button on click of 'Search' locally
            app.$saveBlockAssetBtn.removeClass('hidden');
        }

        $.ajax({
            url: BaseUrl + "Asset.ashx",
            type: "get", //send it through get method
            data: { fn: fileName, tg: tags },
            success: function (response) {
                if (response.substr(0, 1) == "[") {
                    var data = response.substr(0, response.lastIndexOf("]") + 1);
                    dataObj = JSON.parse(data),
                    $searchResults = $('#assetsFound #asset-lib-item-list'),
                    resultsString = '';

                    // Empty the Search results
                    $searchResults.empty();

                    // For each result, create a list item that can be used by the user to select the image asset
                    $.each(dataObj, function (key, value) {
                        resultsString += '<li class="list-group-item">';
                        resultsString += '<input type="checkbox" name="block-asset-item" id="asset_' + value.AssetId + '" ';
                        resultsString += 'class="hidden asset-lib-selection-checkbox" value="' + value.AssetId + '">';
                        resultsString += '<label for="asset_' + value.AssetId + '" class="asset-lib-label">';
                        resultsString += '<img src="' + globalUrls.smallThumbFolder + value.AssetId + '.jpg" alt="Asset ' + value.AssetId + '" class="asset-lib-thumb">';
                        resultsString += '<span class="asset-lib-item-name">Asset ' + value.AssetId + '</span>';
                        resultsString += '</label>';
                        resultsString += '</li>';
                    });
                    // Append results to the list
                    $searchResults.append(resultsString);
                    // Show the 'Save assets' button if there are some results.
                    app.$saveBlockAssetBtn.removeClass('hidden');
                } else {
                    alert('No search results found. Please try again.');
                }
            }
        });
    });
});