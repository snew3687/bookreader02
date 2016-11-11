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
  var readingAreaPreviousSize = {
      width: 0,
      height: 0
  };

  
  var initialise = function initialise() {
    initialiseChapterControlHandlers();
    initialiseForCurrentBook();
  };

  function initialiseSizingHandlers() {
    $(window).resize(handleWindowResize);
  }

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
    $("#chapterToFetch").val(currentChapterIndex());
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

  function fetchChapterNumber(chapterNumber, postFetchHandler) {
    chapterNumber = Math.max(chapterNumber, 0);
    chapterNumber = Math.min(chapterNumber, currentBookDescriptor.chapterCount - 1);
    $("#chapterToFetch").val(chapterNumber);

    handleFetchChapter(postFetchHandler);
  }

  function handleFetchChapter(postFetchHandler) {
    var nextChapter = $("#chapterToFetch").val();

    var successHandler = function(chapterContent) {
      displayChapter(chapterContent);
      if (postFetchHandler) {
        postFetchHandler();
      }
    };

    var fetchUrl = "books/" + currentBookUri + "/chapter/" + nextChapter;    
    $.ajax({
      url: fetchUrl,
      type: 'GET',
      success: successHandler
    });
  }

  function displayChapter(chapterContent) {
    chapterElements$ = $(chapterContent);
    nextDisplayedContentIndex = 0;
    displayAndFlowNextPage();
    
    // Align chapter number selector with new chapter
    var chapterIndex = $('#chapterToFetch').val();
    $("#chapterControlNumber").val(chapterIndex);

    initialiseSizingHandlers();
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

  // TODO: Need to set up an "on resize" event to reflow current page content

  function currentChapterIndex() {
    return Number($('#chapterControlNumber').val());
  }

  function displayPreviousPage() {
    if (!isAtFirstPageOfChapter()) {
      displayAndFlowPreviousPage();
    } else if (currentChapterIndex() === 0) {
      return;
    } 
    else {
      var previousChapterNumber = Number($("#chapterToFetch").val()) - 1;
      fetchChapterNumber(
       previousChapterNumber,
       function() {
        while (!isAtLastPageOfChapter()) {
          displayNextPage();
        }
       });
    }
  }

  function displayNextPage() {
    if (!isAtLastPageOfChapter()) {
      displayAndFlowNextPage();
    } else {
      var nextChapterNumber = Number($("#chapterToFetch").val()) + 1;
      fetchChapterNumber(nextChapterNumber); 
    }
  }

  function displayAndFlowPreviousPage() {
    $('#readingAreaContainer').empty();
    if (isAtFirstPageOfChapter()) {
      $('#readingAreaContainer').html('<p>No chapter content to display</p>');
      return;
    }

    addAsManyContentPreviousElementsAsCanFit(firstDisplayedContentIndex);
  }

  function displayAndFlowNextPage() {
    $('#readingAreaContainer').empty();
    if (isAtLastPageOfChapter()) {
      $('#readingAreaContainer').html('<p>No chapter content to display</p>');
      return;
    }
    firstDisplayedContentIndex = nextDisplayedContentIndex;
    nextDisplayedContentIndex = firstDisplayedContentIndex; 

    addAsManyContentNextElementsAsCanFit(nextDisplayedContentIndex);
  }

  function handleWindowResize() {
    // TODO: Consider whether it is inefficient for this function to be called too often.
    // Frequency of calls will depend on browser. Might be better to delay attempts to
    // resize? Or use library like: http://marcj.github.io/css-element-queries/
    var readingAreaElement$ = $('#readingAreaContainer');
    if (isReadingAreaLargerNow(readingAreaElement$)) {
      addAsManyContentNextElementsAsCanFit(nextDisplayedContentIndex);
    } else {
      removePageContentToFit();
    }
    saveReadingAreaSize();
  }

  function saveReadingAreaSize() {
    var readingAreaElement$ = $('#readingAreaContainer');
    readingAreaPreviousSize.width = readingAreaElement$.width();
    readingAreaPreviousSize.height = readingAreaElement$.height();
  }

  function isReadingAreaLargerNow(readingAreaElement$) {
    return readingAreaElement$.width() > readingAreaPreviousSize.width ||
      readingAreaElement$.height() > readingAreaPreviousSize.height;
  }

  function addAsManyContentPreviousElementsAsCanFit(startingContentIndex) {
    var lastAddedElement = null;
    nextDisplayedContentIndex = startingContentIndex;

    for (var i = firstDisplayedContentIndex - 1; i >= 0; i--) {
      lastAddedElement = chapterElements$[i];
      $('#readingAreaContainer').prepend(lastAddedElement );

      if (isReadingContainerLargerThanPage()) {
        $(lastAddedElement).remove(); 
        break;
      } else {
        firstDisplayedContentIndex--;
      }
    }
    saveReadingAreaSize();
  }

  function removePageContentToFit() {
    var lastAddedElement = null;

    while (isReadingContainerLargerThanPage()) {
      lastAddedElement = chapterElements$[nextDisplayedContentIndex  - 1];
      $(lastAddedElement).remove(); 
      nextDisplayedContentIndex--;
    }
  }

  

  function addAsManyContentNextElementsAsCanFit(startingContentIndex) {
    for (var i = startingContentIndex; i < chapterElements$.length; i++) {
      tryIncrementPageContent();
    }
    saveReadingAreaSize();
  }

  function tryIncrementPageContent() {
    var lastAddedElement = chapterElements$[nextDisplayedContentIndex];
    $('#readingAreaContainer').append(lastAddedElement );

    if (isReadingContainerLargerThanPage()) {
      $(lastAddedElement).remove(); 
      return false;
    } else {
      nextDisplayedContentIndex++;
      return true;
    }
  }

  function isAtFirstPageOfChapter() {
    return firstDisplayedContentIndex <= 0;
  }

  function isAtLastPageOfChapter() {
    return nextDisplayedContentIndex >= chapterElements$.length;
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
