export namespace BookReaderClasses {

  export interface IBookLibrary<T> {
    [K : string] : T
  }


  export class BookMark {
    constructor (public chapterIndex? : number, public contentIndex? : number) {

    }
  }

  export class ChapterEntry {
    constructor (public chapterHeading: commonmark.Node, public chapterTextNodes: commonmark.Node[]) {

    }
  }

  export class ChapterTitleDescriptor {

    constructor (
      public chapterIndex : number,
      public chapterDisplayIndex : number, 
      public titleText : string) {
        
    }
  }

  export class BookDescriptor {
    Title : string;
    Author : string;
    ReleaseDate : string;
    Language : string;
    chapterCount : number;
    chapterTitles : ChapterTitleDescriptor[];
    bookUri : string;
    bookmark : BookMark;
    rating : number;
  }  

  export class Book {

    constructor(public descriptor : BookDescriptor, public chapterSet : ChapterEntry[]) {
    }
  }
}

