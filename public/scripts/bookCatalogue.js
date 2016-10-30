var bookCatalogue = function() {

  var initialise = function initialise() {
    loadAllBookInformation();
  };
 
  function loadAllBookInformation() {

    $.ajax({
      url: "books/all",
      type: 'GET',
      success: listAllBookInformation
    });
  }

  function listAllBookInformation(allBookDescriptors) {
    var $list = $('div#bookListContainer > ul');
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
