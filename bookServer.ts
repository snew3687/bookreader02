import * as _ from "lodash";
import * as fs from "fs";
import * as commonmark from "commonmark";

var reader = new commonmark.Parser();
var writer = new commonmark.HtmlRenderer();

var booksDocRoot = 'BOOKS_DOC_ROOT_NOT_INITIALISED';
var bookLibrary = { };

function initialiseServer(options) {

  if (options.booksDocRoot) {
    booksDocRoot = options.booksDocRoot;
  }
  loadBookMetaData();
  initialiseRatingData();
  initialiseBookmarks();
}  

function initialiseBookmarks() {
  // This bookmark information is hard-coded to supply some data for display

  bookLibrary['JaneAusten_PrideAndPrejudice'].descriptor.bookmark = { 'chapterIndex' : 5, 'contentIndex': 0 };
  bookLibrary['LewisCarroll_AlicesAdventuresInWonderland'].descriptor.bookmark = { 'chapterIndex' : 7, 'contentIndex': 0 };
}

function loadBookMetaData() {
  _.each(getBookDirectoryNames(), loadBook);
}

function initialiseRatingData() {
  // This rating information is hard-coded to supply some data for display

  _.each(bookLibrary, function(book) { book.descriptor.rating = 0 }); // Apply a default for all

  // These are the "top rated" books
  bookLibrary['BramStoker_Dracula'].descriptor.rating = 5;
  bookLibrary['LewisCarroll_AlicesAdventuresInWonderland'].descriptor.rating = 4;
  bookLibrary['MarkTwain_AdventuresOfHuckleberryFinn'].descriptor.rating = 4;
  bookLibrary['RudyardKipling_TheJungleBook'].descriptor.rating = 3;
}

function getBookmarkedBookDescriptors() {
  return _.chain(bookLibrary)
        .map('descriptor')
        .filter(function(descriptor) {
          var bookmark = descriptor.bookmark;
          return _.isObjectLike(bookmark) 
              && _.isNumber(bookmark.chapterIndex)
              && _.isNumber(bookmark.contentIndex)
              && bookmark.chapterIndex >= 0
              && bookmark.contentIndex >= 0
        })
        .map(function(descriptor) { return cloneDescriptorWithoutTitles(descriptor) })
        .value();
}

function getTopRatedBookDescriptors(maxNumber) {
  if (!maxNumber) {
    maxNumber = 4;
  }

  return _.chain(bookLibrary)
        .map('descriptor')
        .map(function(descriptor) { return cloneDescriptorWithoutTitles(descriptor) })
        .sortBy('rating')
        .reverse()
        .take(maxNumber)
        .value();
}

function getBookDirectoryNames() {
  var result = [];
  var files = fs.readdirSync(booksDocRoot);
  _.each(files, function(directoryName) {
    var fileObject = fs.statSync(booksDocRoot + '\\' + directoryName);
    if (fileObject.isDirectory()) {
      result.push(directoryName);
    }
  });

  return result;
}

function ChapterTitleDescriptor(chapterIndex, chapterDisplayIndex, titleText) {
  this.chapterIndex = chapterIndex;
  this.chapterDisplayIndex = chapterDisplayIndex;
  this.titleText = titleText;
}

function Book(descriptor, chapterSet)
{
  this.descriptor = descriptor;
  this.chapterSet = chapterSet;
}

function loadBook(bookUri) {
  if (bookLibrary[bookUri]) return bookLibrary[bookUri];

  console.log('-----------------');
  console.log('Loading book for URI: ' + bookUri);
  var chapterSet = loadBookChapterSet(bookUri);
  var bookDescriptor = loadBookDescriptor(bookUri); 
  bookDescriptor.chapterCount = chapterSet.length;
  bookDescriptor.chapterTitles = determineChapterTitles(chapterSet);
  bookDescriptor.bookUri = bookUri;
  bookDescriptor.bookmark = null;

  bookLibrary[bookUri] = new Book(bookDescriptor, chapterSet); 

  return true; 
}

function loadBookDescriptor(bookUri) {
  var filepath = booksDocRoot + '\\' + bookUri + '\\bookDescriptor.json';
  var data = fs.readFileSync(filepath, 'utf8');
  var descriptor = JSON.parse(data);
  return descriptor;
}

function loadBookChapterSet(bookUri) {
  var filepath = booksDocRoot + '\\' + bookUri + '\\bookChapters.md';
  var data = fs.readFileSync(filepath, 'utf8');
  return parseAndLoadBook(data);
}

function setBookmark(bookUri, bookmarkDescriptor) {
  var bookDescriptor = getBookDescriptor(bookUri, true);
  if (!bookDescriptor.bookmark) {
    bookDescriptor.bookmark = { };  
  }

  bookDescriptor.bookmark.chapterIndex = Number(bookmarkDescriptor.chapterIndex);
  bookDescriptor.bookmark.contentIndex = Number(bookmarkDescriptor.contentIndex);

  return bookmarkDescriptor;
}

function setRating(bookUri, newRating) {
  if (bookLibrary[bookUri]) {
    bookLibrary[bookUri].descriptor.rating = newRating;
  } else {
    console.log('Canot set rating. Book not found for URI: ' + bookUri);
  }
}

function determineChapterTitles(chapterSet) {
  return _.map(chapterSet, function(chapter, chapterIndex) {
    return new ChapterTitleDescriptor(
      chapterIndex,
      chapterIndex, // TODO - extend this "displayIndex" to include non-zero-based, Roman numerals, etc.
      determineHeadingText(chapter.chapterHeading)
    );
  });
}

function determineHeadingText(headingNode) {
  var headingText = '';
  var currentChildNode = headingNode.firstChild;
  while (currentChildNode) {
    if (currentChildNode.type == 'text') {
      headingText += currentChildNode.literal;
    }
    currentChildNode = currentChildNode.next;
  }
  return headingText;
}


function parseAndLoadBook(fileContent) {
  var parsedBookDocument = reader.parse(fileContent); // parsedBookDocument is a 'Node' tree 

  var currentNode = parsedBookDocument.firstChild;

  var chapterSet = [];
  var chapterEntry = {};

  // Skip nodes up to heading
  do
  {
    if (currentNode.type == 'heading')
      break;
  } while ((currentNode = currentNode.next) !== null);

  while (currentNode) {
    // Create entry, with heading assigned
    chapterEntry  = {
      chapterHeading: currentNode,
      chapterTextNodes: [] 
    };

    //console.log('Reading chapter: ' + currentNode.literal);
    // Keep accumulating text nodes, up to next heading
    while ((currentNode = currentNode.next) !== null && currentNode.type !== 'heading') {
      //console.log('Adding node type - ' + currentNode.type);
      chapterEntry.chapterTextNodes.push(currentNode); 
    }
    chapterSet.push(chapterEntry);
  }
  
  return chapterSet;
}

function cloneDescriptorWithoutTitles(descriptor) {
    // Shallow clone the original, so as not to clear out the chapterTitles
    return _.omit(descriptor, 'chapterTitles');
}

function getBookDescriptor(bookUri, isFetchChapterTitles) {
  console.log("getBookDescriptor(): Start. isFetchChapterTitles = " + isFetchChapterTitles);

  var book;
  var result = 
  {
    // These following properties should be loaded from book descriptor
    "Title": "Unknown book",
    "Author": "Unknown Author",
    "Posting Date": null,
    "Release Date": null,
    "Last updated": null,
    "Language": "Unknown language",
    // Following properties added after initial load from file
    chapterCount: 0, 
    bookmark: null
  };

  if (loadBook(bookUri)) {
    _.assign(result, bookLibrary[bookUri].descriptor);
  }

  if (result.chapterTitles) {
    console.log("chapterTitleCount = " + result.chapterTitles.length);
  } else {
    console.log("No chapter titles loaded");
  }

  // Chapter titles are loaded into the descriptor by default. But
  // don't return them if they are not needed
  if (!isFetchChapterTitles) {
    result = cloneDescriptorWithoutTitles(result);
  }
  return result;
}

function getBookChapter(bookUri, chapterIndex) {
  var chapterNumber = chapterIndex + 1;
  var result = '<p>Chapter - ' + chapterNumber + ' - not found</p>';

  if (!loadBook(bookUri)) {
    return '<p>Book not found for URL - ' + bookUrl;
  }

  var book = bookLibrary[bookUri];
  var chapterEntry;

  if (book.chapterSet[chapterIndex]) {
    chapterEntry = book.chapterSet[chapterIndex];

    // Render chapter heading
    result = writer.render(chapterEntry.chapterHeading);

    var renderedTextNodes = 
      _.map(chapterEntry.chapterTextNodes, function(textNode) {
        return writer.render(textNode)
      }).join(''); 

    result += renderedTextNodes
  }
  return result;
}

function getAllBookDescriptors() {
  return _.map(bookLibrary, function(book) {
    return cloneDescriptorWithoutTitles(book.descriptor)
  });
}

exports.getAllBookDescriptors = getAllBookDescriptors;
exports.getTopRatedBookDescriptors = getTopRatedBookDescriptors;
exports.getBookmarkedBookDescriptors = getBookmarkedBookDescriptors; 
exports.getBookDescriptor = getBookDescriptor;
exports.getBookChapter = getBookChapter;
exports.initialiseServer = initialiseServer;
exports.setBookmark = setBookmark;
exports.setRating = setRating;
