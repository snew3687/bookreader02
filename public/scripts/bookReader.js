var bookReader = function() {

  // currentBookDescriptor - will be an object of the form:
  // {
  //   "Title": "Pride and Prejudice",
  //   "Author": "Jane Austen",
  //   "PostingDate": "August 26, 2008 [EBook #1342]",
  //   "ReleaseDate": "June, 1998",
  //   "LastUpdated": "February 15, 2015",
  //   "Language": "English"
  // }
  var currentBookDescriptor = { };
  var currentBookUri = 'BOOK_URI_NOT_YET_ASSIGNED'; 

  var initialise = function initialise() {
    initialiseChapterControlHandlers();
    loadAllBookInformation();
  };

  function initialiseChapterControlHandlers() {
    // First/Previous/Next/Last controls
    $('#chapterControlFirst')
      .on('click', { fetchType: 'first' }, handleChapterControl );
    $('#chapterControlPrevious')
      .on('click', { fetchType: 'previous' }, handleChapterControl );
    $('#chapterControlNext')
      .on('click', { fetchType: 'next' }, handleChapterControl );
    $('#chapterControlLast')
      .on('click', { fetchType: 'last' }, handleChapterControl );
  }

  function initialiseChapterNumberControl() {
    var allChapterNumbers = [];

    $('#chapterControlNumber').unbind('change');
    $('#chapterControlNumber').children().remove();

    for (var i = 1; i <= currentBookDescriptor.chapterCount; ++i) allChapterNumbers.push(i);

    $.each(allChapterNumbers, function (i, item) {
        $('#chapterControlNumber').append($('<option>', { 
            value: item,
            text : 'Chapter ' + item 
        }));
    });

    $('#chapterControlNumber').bind('change', handleChapterNumberControlChange);
  }

  function handleChapterNumberControlChange() {
    var chapterNumber = $('#chapterControlNumber').val();
    $("#chapterToFetch").val(chapterNumber);
    handleFetchChapter();
  }

  function handleBookLinkClick(evt) {
    evt.preventDefault();
    currentBookUri = $(this).attr('data-bookUri');

    loadBookInformation();

    // Load first chapter
    $('#chapterToFetch').val(1);
    handleFetchChapter();
  }

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
          '<a class="bookLink" href="#" data-bookUri="' + item.bookUri + '">' +
            '<span class="authorName">' + item.Author + '</span>' +
            '&#45;' +
            '<span class="bookTitle">' + item.Title + '</span>' +
          '</a>' +
        '</li>' 
      ));
    });

    $("a.bookLink").on('click', handleBookLinkClick);
    /****
        <li>
          <a class="bookLink" href="#" data-bookUri="JaneAusten_PrideAndPrejudice">
            <span class="authorName">Jane Austen</span>
            &#45;
            <span class="bookTitle">Pride and Prejudice</span>
          </a>
        </li> 
    ****/
  }

  function loadBookInformation() {

    $.ajax({
      url: "books/" + currentBookUri,
      type: 'GET',
      success: storeAndDisplayBookInformation
    });
  }

  function storeAndDisplayBookInformation(bookDescriptor) {
    currentBookDescriptor = bookDescriptor;
    $('div#bookHeader h1').text(currentBookDescriptor.Title);
    $('#bookAuthor').text(currentBookDescriptor.Author);
    initialiseChapterNumberControl();
  }

  function handleChapterControl(evt) {
    evt.preventDefault();

    var fetchType = evt.data.fetchType;
    var chapterNumber = Number($("#chapterToFetch").val());
    if (fetchType === 'first') {
      chapterNumber = 1;
    } else if (fetchType === 'previous') { 
      chapterNumber -= 1;
    } else if (fetchType === 'next') { 
      chapterNumber += 1;
    } else if (fetchType === 'last') { 
      chapterNumber = currentBookDescriptor.chapterCount; 
    } else {
      // do nothing
    }
    
    chapterNumber = Math.max(chapterNumber, 1);
    chapterNumber = Math.min(chapterNumber, currentBookDescriptor.chapterCount);
    $("#chapterToFetch").val(chapterNumber);

    handleFetchChapter();
  }

  function handleFetchChapter() {
    var nextChapter = $("#chapterToFetch").val();

    var fetchUrl = "books/" + currentBookUri + "/chapter/" + nextChapter;    
    $.ajax({
      url: fetchUrl,
      type: 'GET',
      success: displayChapter
    });
  }

  function displayChapter(chapterContent) {
    $('#readingAreaContainer').html(chapterContent);

    // Align chapter number selector with new chapter
    var chapterNumber = $('#chapterToFetch').val();
    $("#chapterControlNumber").val(chapterNumber);
  }

  return {
    initialise: initialise
  };
}();
