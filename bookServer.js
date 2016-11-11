var fs = require('fs');
var commonmark = require('commonmark');
var reader = new commonmark.Parser();
var writer = new commonmark.HtmlRenderer();

var booksDocRoot = 'BOOKS_DOC_ROOT_NOT_INITIALISED';
var bookLibrary = { };

function initialiseServer(options) {

  if (options.booksDocRoot) {
    booksDocRoot = options.booksDocRoot;
  }
  loadBookMetaData();
}  

function loadBookMetaData() {
  forEachBookDirectory(loadBook);
}

function forEachBookDirectory(callback) {
  var directoryName = 'NOT_INITIALISED';
  var fileObject;
 
  console.log('forEachBookDirectory(): Loading book directories from ' + booksDocRoot + ' ...');
  var files = fs.readdirSync(booksDocRoot);
  for (var index in files) {
    directoryName = files[index];
    fileObject = fs.statSync(booksDocRoot + '\\' + directoryName);
    if (fileObject.isDirectory()) {
      console.log('Invoking callback on: ' + directoryName);
      callback(directoryName);
    } else {
      console.log('Skipping: ' + directoryName);
    }
  }

  console.log("forEachBookDirectory(): Loaded book directories.");
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
  console.log('Start - Read book descriptor from - ' + filepath);
  var data = fs.readFileSync(filepath, 'utf8');
  var descriptor = JSON.parse(data);
  console.log('End - Read book descriptor ' + JSON.stringify(descriptor));
  return descriptor;
}

function loadBookChapterSet(bookUri) {
  var filepath = booksDocRoot + '\\' + bookUri + '\\bookChapters.md';
  console.log('About to read file - ' + filepath);
  var data = fs.readFileSync(filepath, 'utf8');
  console.log('About to parse file data - ' + data.substring(0,50));

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

function determineChapterTitles(chapterSet) {
  var chapterTitleDescriptors = [];
  var chapterTitleDescriptor = null;
  var chapterDisplayIndex;
  var title;

  
  for (var chapterIndex = 0; chapterIndex < chapterSet.length; chapterIndex++) {
    chapterDisplayIndex = chapterIndex; // TODO - extend this to include non-zero-based, Roman numerals, etc.
    title = determineHeadingText(chapterSet[chapterIndex].chapterHeading);
    chapterTitleDescriptor = new ChapterTitleDescriptor(chapterIndex, chapterDisplayIndex, title); 
    chapterTitleDescriptors.push(chapterTitleDescriptor);
  }
  return chapterTitleDescriptors;
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
    var clone = { };
    Object.assign(clone, descriptor);
    clone.chapterTitles = null;
    return clone;
}

function getBookDescriptor(bookUri, isFetchChapterTitles) {
  console.log("getBookDescriptor(): Start. isFetchChapterTitles = " + isFetchChapterTitles);

  var book;
  var result = 
  {
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
    result = bookLibrary[bookUri].descriptor;
    result.chapterCounter = 0;
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

    // Render all chapter paragraphs
    var i = 0;
    var textNode;
    for (var nodeIndex in chapterEntry.chapterTextNodes)
    {
      textNode = chapterEntry.chapterTextNodes[nodeIndex];
      result += writer.render(chapterEntry.chapterTextNodes[nodeIndex]);
      i++;
    }
  } 

  return result;
}

function getAllBookDescriptors() {
  var result = [];
  var bookUri = '';
  var nextDescriptor;

  console.log("Invoking getAllBookDescriptors()...");
  for (bookUri in bookLibrary) {
    // Chapter titles are loaded into the descriptor by default. But
    // don't return them if they are not needed
    console.log("Fetching book with URI - " + bookUri);
    nextDescriptor = cloneDescriptorWithoutTitles(bookLibrary[bookUri].descriptor);
    result.push(nextDescriptor);
  }
  return result;
}

exports.getAllBookDescriptors = getAllBookDescriptors;
exports.getBookDescriptor = getBookDescriptor;
exports.getBookChapter = getBookChapter;
exports.initialiseServer = initialiseServer;
exports.setBookmark = setBookmark;
