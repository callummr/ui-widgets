var app = app || {};
$(document).ready(function () {

    var BaseUrl = "http://ssodev-be.macmillan.org.uk/be/api/pdf/";

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
    $('#btnSearchAssets').on('click', function(){
        var fileName = $('#txtSearchFilename').val(),
            tags     = $('#txtSearchTags').val();

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
                        resultsString+= '<li class="list-group-item">';
                            resultsString+= '<input type="checkbox" name="block-asset-item" id="asset_' + value.AssetId + '" ';
                            resultsString+=         'class="hidden asset-lib-selection-checkbox" value="'+ value.AssetId + '">';
                            resultsString+= '<label for="asset_' + value.AssetId + '" class="asset-lib-label">';
                                resultsString+= '<img src="' + value.Path + '" alt="Asset '+ value.AssetId + '" class="asset-lib-thumb">';
                                resultsString+= '<span class="asset-lib-item-name">Asset ' + value.AssetId + '</span>';
                            resultsString+= '</label>';
                        resultsString+= '</li>';
                    });
                    // Append results to the list
                    $searchResults.append(resultsString);
                } else {
                    alert('no data returned...');
                }
            }
        });  
    });

    // $('#btnSearchAssets').on('click', function () {

    //     var FileName = $('#txtSearchFilename').val();
    //     var Tags = $('#txtSearchTags').val();

    //     $.ajax({
    //         url: BaseUrl + "Asset.ashx",
    //         type: "get", //send it through get method
    //         data: { fn: FileName, tg: Tags },
    //         success: function (response) {

    //             if (response.substr(0, 1) == "[") {

    //                 var data = response.substr(0, response.lastIndexOf("]") + 1);
    //                 var dataObj = JSON.parse(data);

    //                 var SearchResults = $('#assetsFound');

    //                 $(SearchResults).empty();

    //                 $.each(dataObj, function (key, value) {

    //                     $(SearchResults).append("<div class='draggableItem'><img data-assetid=" + value.AssetId + " width='80px' height='80px' src=" + value.Path + "></img></div>");

    //                 });

    //                 $(".draggableItem").draggable();
    //             }
    //             else {
    //                 alert('no data returned...');
    //             }
    //         }
    //     });
    // });
    //*************************************************************

    $(".droppable").droppable({
        drop: function (event, ui) {

            var blockAssets = null;
            var blockId = $(this).attr("data-blockid");
            var assetId = $($(ui.draggable).children()[0]).attr('data-assetid');
            var IsDefault = 0;                                                       ///<------  NEED TO CAPTURE THIS SOMEHOW.

            var tmp = $('#pdfItemAdmin1$hdnBlockAssets').val();
            if (tmp != "") {

                blockAssets = JSON.parse(tmp);

                for (var i = 0; i < blockAssets.length; i++) {

                    var b = blockAssets[i];
                    if (b.BlockId == blockId && b.AssetId == assetId) {
                        return;
                    }
                }
            }
            else {
                blockAssets = new Array();
            }

            blockAssets.push({ "BlockId": blockId, "AssetId": assetId, "Def": IsDefault });
            $("#hdnBlockAssets").val(JSON.stringify(blockAssets));
        }
    });
});