"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var BookReaderClasses;
(function (BookReaderClasses) {
    var BookMark = (function () {
        function BookMark(chapterIndex, contentIndex) {
            this.chapterIndex = chapterIndex;
            this.contentIndex = contentIndex;
        }
        return BookMark;
    }());
    BookReaderClasses.BookMark = BookMark;
    var ChapterEntry = (function () {
        function ChapterEntry(chapterHeading, chapterTextNodes) {
            this.chapterHeading = chapterHeading;
            this.chapterTextNodes = chapterTextNodes;
        }
        return ChapterEntry;
    }());
    BookReaderClasses.ChapterEntry = ChapterEntry;
    var ChapterTitleDescriptor = (function () {
        function ChapterTitleDescriptor(chapterIndex, chapterDisplayIndex, titleText) {
            this.chapterIndex = chapterIndex;
            this.chapterDisplayIndex = chapterDisplayIndex;
            this.titleText = titleText;
        }
        return ChapterTitleDescriptor;
    }());
    BookReaderClasses.ChapterTitleDescriptor = ChapterTitleDescriptor;
    var BookDescriptor = (function () {
        function BookDescriptor() {
        }
        return BookDescriptor;
    }());
    BookReaderClasses.BookDescriptor = BookDescriptor;
    var Book = (function () {
        function Book(descriptor, chapterSet) {
            this.descriptor = descriptor;
            this.chapterSet = chapterSet;
        }
        return Book;
    }());
    BookReaderClasses.Book = Book;
})(BookReaderClasses = exports.BookReaderClasses || (exports.BookReaderClasses = {}));
