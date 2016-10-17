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
    initialiseForCurrentBook();
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

  function initialiseForCurrentBook(evt) {
    currentBookUri = getQueryParameter('bookUri');
    loadBookInformation();

    // Load first chapter
    $('#chapterToFetch').val(1);
    handleFetchChapter();
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
    $('#bookTitle').text(currentBookDescriptor.Title);
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

  function getQueryParameter(parameterName) {
    var queryDict = {};
    location.search.substr(1).split("&").forEach(function(item) {queryDict[item.split("=")[0]] = item.split("=")[1]});
    return queryDict[parameterName];
  }

  return {
    initialise: initialise
  };
}();
