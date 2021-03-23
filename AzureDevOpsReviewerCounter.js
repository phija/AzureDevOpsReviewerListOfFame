// ==UserScript==
// @name        Azure DevOps PR Reviewer Counter
// @author      phija
// @namespace   jarvers.de
// @description In Azure DevOps, on a project's "Completed PRs" page (Repos > Pull requests > Completed) it counts the reviewers within a specific period of time.
// @include     *://dev.azure.com/*/pullrequests?_a=completed
// @grant       none
// @require     https://ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.min.js
// @require     https://ajax.googleapis.com/ajax/libs/jqueryui/1.12.1/jquery-ui.min.js
// @version     0.1.0
// ==/UserScript==

//Avoid conflicts
this.$ = this.jQuery = jQuery.noConflict(true);
$(document).ready(function()
{
  //alert("jQuery is loaded");
});

function createButton() {
    var header = $('div.navigation-section.flex-column.flex-grow.scroll-hidden.v-scroll-auto.custom-scrollbar').map(function() {
        if ($(this).attr('role') == "menubar") {
            $(this).append('<div id="countButtonDiv"><a id="countButton" aria-setsize="1" aria-posinset="1" aria-roledescription="button" class="bolt-header-command-item-button bolt-button bolt-link-button enabled primary bolt-focus-treatment" data-focuszone="focuszone-3" data-is-focusable="true" ' +
                           'role="menuitem" tabindex="0"><span class="bolt-button-text body-m">Count Reviewers</span></a></div>');
            $('a#countButton').click(function() {
                countReviewers();
            });

            // from - to
            var now = new Date($.now());
            var threeWeeksAgo = new Date();
            threeWeeksAgo.setDate(now.getDate() - 21);
            var to = $.datepicker.formatDate('yy-mm-dd', now);
            var from = $.datepicker.formatDate('yy-mm-dd', threeWeeksAgo);
            $(this).append('<br><div><table style="width=80%;"><tr><td><label for="countFrom">From: </label><br><input style="color:#000;" size=10 id="countFrom" value="' + from + '"/></td>'+
                           '<td><label for="countFrom">To: </label><br><input id="countTo" style="color:#000;" size=10 value="' + to +'"/></td></tr></table></div>');
        }
    });
}

jQuery.fn.outerHTML = function() {
  return jQuery('<div />').append(this.eq(0).clone()).html();
};

function countReviewers() {
    var names = {};
    var images = {};
    var rows = 0;
    var totalCountReviews = 0;
    var oldestPr = new Date();
    var newestPr;

    $('input').removeData();

    var fromDate = new Date($('input#countFrom').val());
    var toDate = new Date($('input#countTo').val());
    toDate.setHours(23, 59, 59);
    // console.log("from", fromDate);
    // console.log("to", toDate);

    if (fromDate > toDate) {
        alert('Your dates are in wrong order!');
    }

    // iterate over all rows
    $('a.bolt-list-row').map(function() {
        if ($(this).attr('role') == "row")
        {
            var takeRow = false;

            // 1. find the timestamp of the PR
            $(this).find('time').map(function() {
                var dateTime = new Date($(this).attr('datetime'));

                if (dateTime >= fromDate &&
                    dateTime <= toDate) {
                    takeRow = true;
                    if (newestPr == undefined) {
                        newestPr = dateTime;
                    }
                    oldestPr = dateTime;
                }
            });

            if (takeRow) {
                $(this).find('img.size24').map(function() {
                    var name = $(this).attr('alt');
                    if (names[name] == undefined)
                    {
                        images[name] = $(this).outerHTML();
                        // console.log(images[name]);
                        names[name] = 0;
                    }
                    names[name] += 1;
                    // console.log(name, names[name]);
                    totalCountReviews++;
                });
                rows++;
            }
        }
    });

    var keys = Object.keys(names);
    var values = Object.values(names);
    console.log(rows + " rows counted, " + totalCountReviews + " reviews found!, " + keys.length + " names");

    var keyItems = Object.keys(names).map(function(key) {
        return [key, names[key]];
    });

    // Sort the array based on the second element
    keyItems.sort(function(first, second) {
        return second[1] - first[1];
    });

    // log results
    for (var i = 0; i < keyItems.length; i++)
    {
        console.log(keyItems[i][1] + "-" + keyItems[i][0]);
    }

    if ($('div#tableOfFame').length > 0) {
        $('div#tableOfFame').remove();
        $('div#status').remove();
    }

    // build table
    $('div#countButtonDiv').append('<div id="tableOfFame"><br><table border=0 id="tableOfFame" style="width:100%; border-spacing=10px;"><tr><th align="right">#</th><th></th><th align="left">Reviewer</th></tr></table></div>');
    for (var j = 0; j < keyItems.length; j++)
    {
        var count = keyItems[j][1];
        var name = keyItems[j][0];
        $('#tableOfFame tr:last').after('<tr> <td style="padding:10px" align="right"><b>'+count+'</b></td> <td>'+ images[name]+'</td> <td>'+name+'</td> </tr>');
    }
    $('div#countButtonDiv').append('<div id="status"><small>&nbsp;# reviews from</small> ' + $.datepicker.formatDate('yy-mm-dd', oldestPr) + ' <small>to</small> ' + $.datepicker.formatDate('yy-mm-dd', newestPr) + '</div>');
}

setTimeout(function() {
    createButton();
}, 1000);
