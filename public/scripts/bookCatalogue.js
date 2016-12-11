/// <reference path="../../typings/globals/jquery/index.d.ts" />
var bookCatalogue = function () {
    var li_a_bookmarkedBookRenderer = null;
    var li_a_topRatedBookRenderer = null;
    var initialise = function initialise() {
        initialiseTemplates();
        loadTopRatedBookInformation();
        loadBookmarkedBookInformation();
    };
    function initialiseTemplates() {
        li_a_bookmarkedBookRenderer = _.template($('#li-a-bookmarkedBook').html());
        li_a_topRatedBookRenderer = _.template($('#li-a-topRatedBook').html());
    }
    function loadTopRatedBookInformation() {
        $.ajax({
            url: "books/toprated",
            type: 'GET',
            success: listTopRatedBookInformation
        });
    }
    function loadBookmarkedBookInformation() {
        $.ajax({
            url: "books/bookmarked",
            type: 'GET',
            success: listBookmarkedBookInformation
        });
    }
    function listTopRatedBookInformation(bookDescriptors) {
        var $list = $('div#topRatedBooksContainer > ul');
        $list.children().remove();
        $(bookDescriptors).each(function (index, item) {
            var rendered = li_a_topRatedBookRenderer({
                'bookUri': item.bookUri,
                'author': item.Author,
                'title': item.Title,
                'rating': item.rating
            });
            $list.append($(rendered));
        });
    }
    function listBookmarkedBookInformation(bookDescriptors) {
        var $list = $('div#bookmarkedBooksContainer > ul');
        $list.children().remove();
        $(bookDescriptors).each(function (index, item) {
            var rendered = li_a_bookmarkedBookRenderer({
                'bookUri': item.bookUri,
                'author': item.Author,
                'title': item.Title,
                'chapterNumber': (item.bookmark.chapterIndex + 1)
            });
            $list.append($(rendered));
        });
    }
    return {
        initialise: initialise
    };
}();
