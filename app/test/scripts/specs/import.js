var should = require('chai').should();
var ImportActions = require('../../../scripts/stores/import.js');

describe('Import', function() {

  var CSV;
  var sheet;
  var headingCellName;
  var headingCellObject;

  before(function() {
    // runs before all tests in this block

    headingCellName = 'A1';

    headingCellObject = {
      t: "s",
      v: "name"
    };

    sheet = {
      "!ref": "A1:E4",
      A1: headingCellObject,
      B1: {
        t: "s",
        v: "type"
      },
      C1: {
        t: "s",
        v: "location"
      },
      D1: {
        t: "s",
        v: "time-start"
      },
      E1: {
        t: "s",
        v: "time-end"
      },
      A2: {
        t: "s",
        v: "fredâs house"
      },
      B2: {
        t: "s",
        v: "infrastructure"
      },
      C2: {
        t: "s",
        v: "[53.1519538,-2.3485634]"
      },
      D2: {
        t: "s",
        v: "942364800"
      },
      E2: {
        t: "s",
        v: "966038400"
      },
      A3: {
        t: "s",
        v: "old mines"
      },
      B3: {
        t: "s",
        v: "mine"
      },
      C3: {
        t: "s",
        v: "[[51.509, -0.08],[51.503, -0.06],[51.51, -0.047]]"
      },
      D3: {
        t: "s",
        v: "959558400"
      },
      E3: {
        t: "s",
        v: "989625600"
      },
      A4: {
        t: "s",
        v: "school"
      },
      B4: {
        t: "s",
        v: "infrastructure"
      },
      C4: {
        t: "s",
        v: "[53.501363, -2.195322]"
      },
      D4: {
        t: "s",
        v: "966038400"
      },
      E4: {
        t: "s",
        v: "1009238400"
      }
    };

    CSV = {
      SheetNames: ['Sheet1'],
      Sheets: {
        Sheet1: sheet
      }
    }
  });

  after(function() {
    // runs after all tests in this block
    sheet = null;
    headingCellName = '';
    headingCellObject = null;
    CSV = null;
  });

  it('should create a cellObject and add it to the cellArray if it isn\'t a ref object', function() {

    var cellArray = [];
    var refCellName = '!ref';

    cellArray = ImportActions.addCellToArray(sheet, refCellName, cellArray);

    cellArray.should.be.an('array');
    cellArray.should.have.length(0);

    cellArray = ImportActions.addCellToArray(sheet, headingCellName, cellArray);

    cellArray.should.have.length(1);
    cellArray[0][headingCellName].should.deep.equal(headingCellObject);

  });

  it('should create an array of cellObjects out of a Sheet Object', function() {

    var cellArray = ImportActions.createCellArray(sheet);

    cellArray.should.be.an('array');
    cellArray.should.have.length(20);
  });

  it('should parse a CSV object and return an array of data objects', function() {

    var outPutObject = {
      name: 'fredâs house',
      type: 'infrastructure',
      location: '[53.1519538,-2.3485634]',
      'time-start': '942364800',
      'time-end': '966038400'
    };

    var dataCollection = ImportActions.parseCSV(CSV);

    dataCollection.should.be.an('array');
    dataCollection.should.have.length(3);
    dataCollection[0].should.deep.equal(outPutObject);
  });
});
