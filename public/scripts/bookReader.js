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
  var chapterElements$ = null;
  var firstDisplayedContentIndex = 0;
  var nextDisplayedContentIndex = 0;

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
    $('#pageControlPrevious')
      .on('click', { fetchType: 'previous' }, handlePageControl );
    $('#pageControlNext')
      .on('click', { fetchType: 'next' }, handlePageControl );
  }

  function initialiseChapterNumberControl() {

    $('#chapterControlNumber').unbind('change');
    $('#chapterControlNumber').children().remove();

    $.each(currentBookDescriptor.chapterTitles, function (i, titleDescriptor) {
        $('#chapterControlNumber').append($('<option>', { 
            value: titleDescriptor.chapterIndex,
            text : titleDescriptor.titleText
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
    $('#chapterToFetch').val(0);
    handleFetchChapter();
  }

  function loadBookInformation() {

    $.ajax({
      url: "books/" + currentBookUri + "?chapterTitles=true",
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
      chapterNumber = 0;
    } else if (fetchType === 'previous') { 
      chapterNumber -= 1;
    } else if (fetchType === 'next') { 
      chapterNumber += 1;
    } else if (fetchType === 'last') { 
      chapterNumber = currentBookDescriptor.chapterCount - 1; 
    } else {
      // do nothing
    }
    
    fetchChapterNumber(chapterNumber);
  }

  function fetchChapterNumber(chapterNumber) {
    chapterNumber = Math.max(chapterNumber, 0);
    chapterNumber = Math.min(chapterNumber, currentBookDescriptor.chapterCount - 1);
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
    chapterElements$ = $(chapterContent);
    nextDisplayedContentIndex = 0;
    displayAndFlowNextPage();
    
    // Align chapter number selector with new chapter
    var chapterIndex = $('#chapterToFetch').val();
    $("#chapterControlNumber").val(chapterIndex);
  }

  function handlePageControl(evt) {
    evt.preventDefault();
    var fetchType = evt.data.fetchType;

    if (fetchType === 'previous') { 
      displayPreviousPage();
    }
    else if (fetchType === 'next') { 
      displayNextPage();
    }
  }

  function displayPreviousPage() {
    if (firstDisplayedContentIndex > 0) {
      displayAndFlowPreviousPage();
    } else {
      var previousChapterNumber = Number($("#chapterToFetch").val()) - 1;
      fetchChapterNumber(previousChapterNumber); 
    }
  }
  function displayNextPage() {
    if (nextDisplayedContentIndex < chapterElements$.length) {
      displayAndFlowNextPage();
    } else {
      var nextChapterNumber = Number($("#chapterToFetch").val()) + 1;
      fetchChapterNumber(nextChapterNumber); 
    }
  }

  function displayAndFlowPreviousPage() {
    var lastAddedElement = null;
    $('#readingAreaContainer').empty();
    if (firstDisplayedContentIndex <= 0) {
      $('#readingAreaContainer').html('<p>No chapter content to display</p>');
      return;
    }

    nextDisplayedContentIndex = firstDisplayedContentIndex;
    for (var i = firstDisplayedContentIndex - 1; i >= 0; i--) {
      lastAddedElement = chapterElements$[i];
      $('#readingAreaContainer').prepend(lastAddedElement );

      if (isReadingContainerLargerThanPage()) {
        $(lastAddedElement).remove(); 
      } else {
        firstDisplayedContentIndex--;
      }
    }
  }

  function displayAndFlowNextPage() {
    var lastAddedElement = null;
    $('#readingAreaContainer').empty();
    if (nextDisplayedContentIndex >= chapterElements$.length) {
      $('#readingAreaContainer').html('<p>No chapter content to display</p>');
      return;
    }

    firstDisplayedContentIndex = nextDisplayedContentIndex;
    for (var i = nextDisplayedContentIndex; i < chapterElements$.length; i++) {
      lastAddedElement = chapterElements$[i];
      $('#readingAreaContainer').append(lastAddedElement );

      if (isReadingContainerLargerThanPage()) {
        $(lastAddedElement).remove(); 
      } else {
        nextDisplayedContentIndex++;
      }
    }
  }

  function isReadingContainerLargerThanPage() {
    return $('#readingAreaContainer').prop('scrollHeight') > $('#readingAreaContainer').height();
  }

  function getQueryParameter(parameterName) {
    var queryDict = {};
    location.search.substr(1).split("&").forEach(function(item) {
      queryDict[item.split("=")[0]] = item.split("=")[1];
    });
    return queryDict[parameterName];
  }

  return {
    initialise: initialise
  };
}();
