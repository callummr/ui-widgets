var app = app || {};
$(document).ready(function () {

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


        if(app.isLocalEnv){
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