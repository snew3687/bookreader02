var bookCatalogue = function() {

  var initialise = function initialise() {
    loadTopRatedBookInformation();
    loadBookmarkedBookInformation();
  };
 
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

  function listTopRatedBookInformation(allBookDescriptors) {
    var $list = $('div#topRatedBooksContainer > ul');
    $list.children().remove();
    $(allBookDescriptors).each(function(index, item) {
      $list.append($(
        '<li>' +
          '<a class="bookLink" href="bookReader/' + item.bookUri + '"' +
            '<span class="authorName">' + item.Author + '</span>' +
            '&#45;' +
            '<span class="bookTitle">' + item.Title + '</span>' +
          '</a>' +
        '</li>' 
      ));
    });
  }

  function listBookmarkedBookInformation(allBookDescriptors) {
    var $list = $('div#bookmarkedBooksContainer > ul');
    $list.children().remove();
    $(allBookDescriptors).each(function(index, item) {
      $list.append($(
        '<li>' +
          '<a class="bookLink" href="bookReader/' + item.bookUri + '"' +
            '<span class="authorName">' + item.Author + '</span>' +
            '&#45;' +
            '<span class="bookTitle">' + item.Title + '</span>' +
          '</a>' +
        '</li>' 
      ));
    });
  }
  return {
    initialise: initialise
  };
}();
