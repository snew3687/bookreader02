
import * as _ from "lodash";
import * as fs from "fs";
import * as commonmark from "commonmark";
import { BookReaderClasses } from "./bookClasses";

namespace BookReaderApp {

  import bc = BookReaderClasses;

  var bookLibrary : bc.IBookLibrary<bc.Book> = {};

  var reader = new commonmark.Parser();
  var writer = new commonmark.HtmlRenderer();

  var booksDocRoot = 'BOOKS_DOC_ROOT_NOT_INITIALISED';


  function initialiseServer(options) : void {

    if (options.booksDocRoot) {
      booksDocRoot = options.booksDocRoot;
    }
    loadBookMetaData();
    initialiseRatingData();
    initialiseBookmarks();
  }  

  function initialiseBookmarks() : void {
    // This bookmark information is hard-coded to supply some data for display

    bookLibrary['JaneAusten_PrideAndPrejudice'].descriptor.bookmark = new bc.BookMark(5, 0 );
    bookLibrary['LewisCarroll_AlicesAdventuresInWonderland'].descriptor.bookmark = new bc.BookMark(7, 0 );
  }

  function loadBookMetaData() : void {
    _.each(getBookDirectoryNames(), loadBook);
  }

  function initialiseRatingData() : void {
    // This rating information is hard-coded to supply some data for display

    _.each(bookLibrary, function(book : bc.Book) { book.descriptor.rating = 0 }); // Apply a default for all

    // These are the "top rated" books
    bookLibrary['BramStoker_Dracula'].descriptor.rating = 5;
    bookLibrary['LewisCarroll_AlicesAdventuresInWonderland'].descriptor.rating = 4;
    bookLibrary['MarkTwain_AdventuresOfHuckleberryFinn'].descriptor.rating = 4;
    bookLibrary['RudyardKipling_TheJungleBook'].descriptor.rating = 3;
  }

  function getBookmarkedBookDescriptors() : bc.BookDescriptor[] {
    return _.chain(bookLibrary)
          .map('descriptor')
          .filter(function(descriptor : bc.BookDescriptor) {
            var bookmark  = descriptor.bookmark;
            return _.isObjectLike(bookmark) 
                && _.isNumber(bookmark.chapterIndex)
                && _.isNumber(bookmark.contentIndex)
                && bookmark.chapterIndex >= 0
                && bookmark.contentIndex >= 0
          })
          .map(function(descriptor : bc.BookDescriptor) { return cloneDescriptorWithoutTitles(descriptor) })
          .value();
  }

  function getTopRatedBookDescriptors(maxNumber) {
    if (!maxNumber) {
      maxNumber = 4;
    }

    return _.chain(bookLibrary)
          .map('descriptor')
          .map(function(descriptor : bc.BookDescriptor) { return cloneDescriptorWithoutTitles(descriptor) })
          .sortBy('rating')
          .reverse()
          .take(maxNumber)
          .value();
  }

  function getBookDirectoryNames() : string[] {
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

  function loadBook(bookUri : string) : boolean {
    if (bookLibrary[bookUri]) return true;

    console.log('-----------------');
    console.log('Loading book for URI: ' + bookUri);
    var chapterSet = loadBookChapterSet(bookUri);
    var bookDescriptor = loadBookDescriptor(bookUri); 
    bookDescriptor.chapterCount = chapterSet.length;
    bookDescriptor.chapterTitles = determineChapterTitles(chapterSet);
    bookDescriptor.bookUri = bookUri;
    bookDescriptor.bookmark = null;

    bookLibrary[bookUri] = new bc.Book(bookDescriptor, chapterSet); 

    return true; 
  }

  function loadBookDescriptor(bookUri : string) : bc.BookDescriptor {
    var filepath = booksDocRoot + '\\' + bookUri + '\\bookDescriptor.json';
    var data = fs.readFileSync(filepath, 'utf8');
    var descriptor = JSON.parse(data);
    return descriptor;
  }

  function loadBookChapterSet(bookUri : string) {
    var filepath = booksDocRoot + '\\' + bookUri + '\\bookChapters.md';
    var data = fs.readFileSync(filepath, 'utf8');
    return parseAndLoadBook(data);
  }

  function setBookmark(bookUri : string, bookmarkDescriptor : bc.BookMark) : bc.BookMark {
    var bookDescriptor = getBookDescriptor(bookUri, true);
    if (!bookDescriptor.bookmark) {
      bookDescriptor.bookmark = new bc.BookMark();  
    }

    bookDescriptor.bookmark.chapterIndex = Number(bookmarkDescriptor.chapterIndex);
    bookDescriptor.bookmark.contentIndex = Number(bookmarkDescriptor.contentIndex);

    return bookmarkDescriptor;
  }

  function setRating(bookUri : string, newRating : number) : void {
    if (bookLibrary[bookUri]) {
      bookLibrary[bookUri].descriptor.rating = newRating;
    } else {
      console.log('Canot set rating. bc.Book not found for URI: ' + bookUri);
    }
  }

  function determineChapterTitles(chapterSet : bc.ChapterEntry[]) : bc.ChapterTitleDescriptor[] {
    return _.map(chapterSet, function(chapter, chapterIndex) {
      return new bc.ChapterTitleDescriptor(
        chapterIndex,
        chapterIndex, // TODO - extend this "displayIndex" to include non-zero-based, Roman numerals, etc.
        determineHeadingText(chapter.chapterHeading)
      );
    });
  }

  function determineHeadingText(headingNode : commonmark.Node) : string {
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


  function parseAndLoadBook(fileContent : string) : bc.ChapterEntry[] {
    var parsedBookDocument = reader.parse(fileContent); // parsedBookDocument is a 'Node' tree 

    var currentNode = parsedBookDocument.firstChild;

    var chapterSet = new Array<bc.ChapterEntry>();
    var chapterEntry : bc.ChapterEntry;

    // Skip nodes up to heading
    do
    {
      if (currentNode.type == 'heading')
        break;
    } while ((currentNode = currentNode.next) !== null);

    while (currentNode) {
      // Create entry, with heading assigned
      chapterEntry  = new bc.ChapterEntry(currentNode, new Array<commonmark.Node>());

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

  function cloneDescriptorWithoutTitles(descriptor : bc.BookDescriptor) : bc.BookDescriptor {
      // Shallow clone the original, so as not to clear out the chapterTitles
      return <bc.BookDescriptor> _.omit(descriptor, 'chapterTitles');
  }

  function getBookDescriptor(bookUri : string, isFetchChapterTitles : boolean) : bc.BookDescriptor {
    console.log("getBookDescriptor(): Start. isFetchChapterTitles = " + isFetchChapterTitles);

    var book : bc.Book;
    var result = new bc.BookDescriptor();
  
    // These following properties should be loaded from book descriptor
    result.Title = "Unknown book";
    result.Author = "Unknown Author";
    result.Language = "Unknown language";

      // Following properties added after initial load from file
    result.chapterCount = 0; 
    result.bookmark = null;

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

  function getBookChapter(bookUri : string, chapterIndex : number) : string {
    var chapterNumber = chapterIndex + 1;
    var result = '<p>Chapter - ' + chapterNumber + ' - not found</p>';

    if (!loadBook(bookUri)) {
      return '<p>bc.Book not found for URL - ' + bookUri;
    }

    var book = bookLibrary[bookUri];
    var chapterEntry : bc.ChapterEntry;
    
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

  function getAllBookDescriptors() : bc.BookDescriptor[] {
    return _.map(bookLibrary, function(book : bc.Book) {
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

}
