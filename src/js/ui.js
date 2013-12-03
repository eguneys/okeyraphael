var TOP = 0;
var LEFT = 1;
var BOTTOM = 2;
var RIGHT = 3;

var NONE = 0;
var RED = 1;
var BLUE = 2;
var GREEN = 3;
var BLACK = 4;

     var istakaStartY = 400;
     var istakaStartX = 10;

     var istakaHeight = 200;
     var istakaWidth = 950;

     var stoneGapX = 3;
     var stoneGapY = 10;

     var stoneHeight = istakaHeight / 2 - stoneGapY;
     var stoneWidth = (istakaWidth / 14) - stoneGapX;

var middleStoneX = (istakaStartX + istakaWidth) / 2;
var middleStoneY = (istakaStartY) / 2 - stoneWidth;

var playerHeight = stoneHeight * 2 - stoneWidth;
var playerWidth = stoneWidth * 3;

var sideStoneSOffset = {
    DOWN: {
	x: istakaStartX + stoneWidth + stoneGapX,
	y: istakaStartY - stoneHeight - stoneGapY
    },
    RIGHT: {
	x: istakaStartX + istakaWidth - stoneWidth * 2 - stoneGapX,
	y: istakaStartY - stoneHeight - stoneGapY
    },
    UP: {
	x: istakaStartX + istakaWidth - stoneWidth * 2 - stoneGapX,
	y: 10 + stoneGapX
    },
    LEFT: {
	x: istakaStartX + stoneWidth + stoneGapX,
	y: 10 + stoneGapX
    }
    
};

function GameViewEvents(base) {
    var self = this;

    self.base = base;

    self.drawMiddleStone = new Event(self.base);
    self.drawDownStone = new Event(self.base);
    self.throwRightStone = new Event(self.base);

    self.gameSit = new Event(self.base);
}



function GameView(paper) {
    var self = this;
    self.paper = paper;

    self.Assets = new OkeyAssets();
    self.Events = new GameViewEvents(self);

    self.rack;
    self.stoneS = [];


    self.throwStoneArea;
    
    self.dragEngine;
    self.movingStone = null;

    self.middleStoneS = {};

    self.seatS = [];

    self.playerS = [];
    
    self.buildRack = function() {
	var r = self.paper.rect(istakaStartX, istakaStartY, istakaWidth, istakaHeight);
	return r;
    }


    self.toColor = function(c) {
	if (c == RED) return "#d00";
	else if (c == BLUE) return "#00d";
	else if (c == GREEN) return "#0d0";
	else if (c == BLACK) return "#000";
    }

    self.toFrontStone = function(s) {
	if (s.data('children')) {
	    s.data('children').forEach(function (item) {
		item.toFront();
	    });
	}
	s.toFront();
    }
    
    self.buildStone = function (data) {
	var children = [];

	var s = self.paper.rect(10, 10, stoneWidth, stoneHeight);
	s.attr({fill: "#000"});
	s.attr({opacity: 0.5});

	s.data('data', data);
	
	var background = self.paper.image('http://placehold.it/200x200', 10, 10, stoneWidth, stoneHeight);
	children.push(background);

	if (data) {
	    var path = paper.path(self.Assets.StonePaths[data.number - 1]);
	    path.attr({fill: self.toColor(data.color)});
	    path.data("offsetX", 10);
	    path.data("offsetY", 10);
	    children.push(path);
	}
	
	s.data('children', children);

	s.toFront();
	return s;
    }

    self.removeStone = function(s) {
	if (s.data('children')) {
	    s.data('children').forEach(function (item) {
		item.remove();
	    });
	}
	var idx = self.stoneS.indexOf(s);
	if (idx != -1) 
	    self.stoneS.splice(idx, 1);
	s.remove();
	
    }

    self.simulateDrawMiddleStone = function() {
	self.removeStone(self.middleStoneS.MIDDLE);

	self.buildMiddleStone();
    }

    self.buildMiddleStone = function() {
	var s = self.buildStone();

	self.dragEngine.dragStone(s, middleStoneX, middleStoneY);
	self.dragEngine.draggableStone(s, function () {
	    
	}, function () {
	    
	}, function (s) {
	    if (self.dragEngine.withinRackStone(s.attr('x'), s.attr('y'))) {
		self.Events.drawMiddleStone.notify();
	    }
	    self.dragEngine.dragStone(s, middleStoneX, middleStoneY, true);
	});

	self.middleStoneS.MIDDLE = s;
    }

    self.AddSideStone = function(side, s) {
	self.dragEngine.dragStone(s, sideStoneSOffset[side].x, sideStoneSOffset[side].y);

	if (side == "DOWN") {
	    self.dragEngine.draggableStone(s, function() {
	    }, function() {
	    }, function(s) {
		if (self.dragEngine.withinRackStone(s.attr('x'), s.attr('y'))) {
		    self.Events.drawDownStone.notify();
		}
		self.dragEngine.dragStone(s, sideStoneSOffset["DOWN"].x, sideStoneSOffset["DOWN"].y, true);
	    });
	}

	self.toFrontStone(s);
    }

    self.buildThrowStoneArea = function() {
	var offset = sideStoneSOffset["RIGHT"];
	self.throwStoneArea = self.paper.rect(offset.x, offset.y, stoneWidth, stoneHeight);
    }

    self.inThrowStone = function(s) {
	var bboxThrow = self.throwStoneArea.getBBox(true);
	if (Raphael.isPointInsideBBox(bboxThrow, s.attr('x') + stoneWidth / 2, s.attr('y') + stoneHeight / 2)) {
	    return true;
	}
	return false;
    }

    self.AddRackStone = function(s, x, y) {
	self.dragEngine.draggableStone(s, null, null, function (s) {
	   if (self.inThrowStone(s)) {
	       self.Events.throwRightStone.notify(s);
	   }

	    self.dragEngine.fixOverlapStone(s, s.attr('x'), s.attr('y'));
	});
	
	self.dragEngine.dragStone(s, self.dragEngine.rackSnapX(x), self.dragEngine.rackSnapY(y));
	self.dragEngine.fixOverlapStone(s, s.attr('x'), s.attr('y'));
	self.stoneS.push(s);
    }


    
        self.playerTurn = function (i, c) {
            self.playerS[i].attr({ fill: '#da0'});

            var progresspath = self.playerS[i].data('progresspath');

            if (progresspath) {
                progresspath.remove();
            }

            i++;
            i = i % c;

            var sprogress = self.playerS[i].data('progress');
            progresspath = paper.arrowline(paper, sprogress, 5000, { stroke: '#ada', 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'bevel', 'fill-opacity': 0}, null);
            self.playerS[i].data('progresspath', progresspath);

            self.playerS[i].attr({fill: '#fb0'});
        }


    
    self.SitPlayer = function(p, side) {
            var seat;
            self.seatS.forEach(function (s) {
                if (s.data('side') == side)
                    seat = s;
            });

        seat.remove();

        var p;
            if (side == TOP) {
                p = self.buildPlayer(p, istakaWidth / 2 - stoneWidth, 10);

            } else if (side == LEFT) {
                p = self.buildPlayer(p, stoneWidth, istakaStartY / 2 - stoneHeight);
            } else if (side == BOTTOM) {
                p = self.buildPlayer(p, istakaWidth / 2 - stoneWidth, istakaStartY - stoneHeight - stoneWidth);
            } else if (side == RIGHT) {
                p = self.buildPlayer(p, istakaWidth - stoneHeight * 2, istakaStartY / 2 - stoneHeight);
            }


            self.playerS.push(p);
    }


    
    self.buildPlayer = function(p, x, y) {

        var s = paper.rect(x, y, playerWidth, playerHeight);
	s.attr({fill: "#da0"}); s.attr({stroke: "#da0"});
	s.attr({'stroke-width': 0}); s.dropShadow(2, 0, 3, 0.5);

	var offset = 1; var sprogress = paper.rect(x - offset, y -
	offset, playerWidth + offset * 2, playerHeight + offset *
	2);


	var imageStar =
	    paper.path("M14.615,4.928c0.487-0.986,1.284-0.986,1.771,0l2.249,4.554c0.486,0.986,1.775,1.923,2.864,2.081l5.024,0.73c1.089,0.158,1.335,0.916,0.547,1.684l-3.636,3.544c-0.788,0.769-1.28,2.283-1.095,3.368l0.859,5.004c0.186,1.085-0.459,1.553-1.433,1.041l-4.495-2.363c-0.974-0.512-2.567-0.512-3.541,0l-4.495,2.363c-0.974,0.512-1.618,0.044-1.432-1.041l0.858-5.004c0.186-1.085-0.307-2.6-1.094-3.368L3.93,13.977c-0.788-0.768-0.542-1.525,0.547-1.684l5.026-0.73c1.088-0.158,2.377-1.095,2.864-2.081L14.615,4.928z").attr({fill:"#dd0", stroke: "none"});

	imageStar.dropShadow(1, 1, 1, 0.5);
	imageStar.transform("t" + x + "," + (y + playerHeight -	35));


	if (p.avatar) {
	    var image = paper.image(p.avatar, x + 4, y + 4, playerWidth / 2, playerHeight - 4 * 2);
	    //	    image.dropShadow(2, 0, 3, 0.5);
	    image.data("star", imageStar); s.data('avatar', image);
	}

	var name = paper.text(x + (playerWidth / 2) + 8, y + 4,
	p.name); name.attr({fill: "#fff"});
	name.dropShadow(1,1,1,0.5);

	s.data('name', name);

	s.data('progress', sprogress);
	s.data('p', p);
	return s;
    }


    
    

 

    self.buildEmptySeat = function (x, y, side) {
        var s = paper.path("M8.037,11.166L14.5,22.359c0.825,1.43,2.175,1.43,3,0l6.463-11.194c0.826-1.429,0.15-2.598-1.5-2.598H9.537C7.886,8.568,7.211,9.737,8.037,11.166z");
	s.attr({fill: '#000', stroke: 'none'});

        s.transform("t" + x + "," + y + "s3");

        s.hover(function () {
            s.animate({transform: "t" + x + "," + y + 's4' }, 1000, "elastic");
        }, function () {
            s.animate({transform: "t" + x + "," + y + 's3' }, 1000, "elastic");
        });

        s.data('side', side);
	
        s.click(function () {
            self.Events.gameSit.notify(s.data('side'));
        });

        return s;
    }

    self.buildEmptySeats = function() {
        var yoffset = 30;
        var xoffset = 30;
        var stop = self.buildEmptySeat(xoffset + istakaWidth / 2 - stoneWidth, 10 + yoffset, TOP);
        var sleft = self.buildEmptySeat(xoffset + stoneWidth, istakaStartY / 2 - stoneHeight + yoffset, LEFT);
        var sbottom = self.buildEmptySeat(xoffset + istakaWidth / 2 - stoneWidth, istakaStartY - stoneHeight - stoneWidth + yoffset, BOTTOM);
        var sright = self.buildEmptySeat(xoffset + istakaWidth - stoneHeight * 2, istakaStartY / 2 - stoneHeight + yoffset, RIGHT);

        self.seatS.push(stop);
        self.seatS.push(sleft);
        self.seatS.push(sbottom);
        self.seatS.push(sright);
    }
    
    self.buildScene = function () {
	var r = self.buildRack();
	self.rack = r;

	self.dragEngine = new DragEngine(self.stoneS, self.rack);
	
	for (var i = 0; i< 14; i++) {
	    var s = self.buildStone({ number: i + 1, color: RED});
	    self.AddRackStone(s, istakaStartX + ((stoneWidth + stoneGapX) * i), istakaStartY);
	}

	self.buildMiddleStone();
	self.buildThrowStoneArea();
	self.buildEmptySeats();
    }
}

function GameViewController(view) {
    var self = this;

    self.view = view;

    self.init = function() {

	var gameview = self.view;
	
	gameview.buildScene();

	gameview.Events.drawMiddleStone.attach(function(sender) {

	    var x = gameview.middleStoneS.MIDDLE.attr('x');
	    var y = gameview.middleStoneS.MIDDLE.attr('y');
	    gameview.simulateDrawMiddleStone();

	    var newStone = gameview.buildStone({number: 1, color: BLUE});
	
	    gameview.AddRackStone(newStone, x, y);
	});

	gameview.Events.throwRightStone.attach(function(sender, s) {
	    gameview.AddSideStone("RIGHT", gameview.buildStone(s.data('data')));
	    gameview.removeStone(s);
	    
	})

	gameview.Events.gameSit.attach(function(sender, side) {
	    gameview.SitPlayer({}, side);
	});


	
    }
    
}

$(document).ready(function() {

    var paper = Raphael(10, 10, 1024, 768);

    var gameViewController = new GameViewController(new GameView(paper));

    gameViewController.init();
});


function DragEngine(stones, rack) {
    var self = this;

    self.stoneS = stones;
    self.rack = rack;

    self.dragStone = function (s, x, y, animate, toFrontDisable) {
	if (animate) {
	    s.animate({x: x , y: y }, 150, "<>");
	} else {
	    s.attr({x: x, y: y});
	}
	
	if (s.data('children')) {
	    s.data('children').forEach(function (item) {
		if (item.data("offsetX")) {
		    var offsetX = item.data("offsetX");
		    var offsetY = item.data("offsetY");
		    if (animate) {
			item.animate({transform: "t" + (x + offsetX) + "," + (y + offsetY)}, 150, "<>");
		    } else {
			item.transform("t" + (x + offsetX) + "," + (y + offsetY));
		    }
		} else{
		    if (animate) {
			item.animate({x: x , y: y }, 150, "<>");
		    } else {
			item.attr({x: x, y: y});
		    }
		}
		if (!toFrontDisable)
		    item.toFront();
	    });
	}
	if (!toFrontDisable)
	    s.toFront();
    }

    self.withinRackStone = function(x, y) {
	var bboxRack = self.rack.getBBox(true);
	if (Raphael.isPointInsideBBox(bboxRack, x + stoneWidth / 2, y + stoneHeight / 2))
	    return true;
	return false;
    }

    self.findOverlap = function(s, x, y) {
	var overlappingStone;
	self.stoneS.forEach(function(item) {
	    if (item == s) return;
	    var bbox = item.getBBox(true);
	    if (x && (Raphael.isPointInsideBBox(bbox, x, y) || Raphael.isPointInsideBBox(bbox, x + stoneWidth + stoneGapX, y)
		     || Raphael.isPointInsideBBox(bbox, x, y + stoneHeight) || Raphael.isPointInsideBBox(bbox, x + stoneWidth + stoneGapX, y + stoneHeight))) {
		overlappingStone = item;
	    }
	});
	return overlappingStone;
    }

    self.findOverlapLeft = function(s, x, y) {
	var overlappingStone;
	self.stoneS.forEach(function(item) {
	    if (item == s) return;
	    var bbox = item.getBBox(true);
	    if (x && Raphael.isPointInsideBBox(bbox, x, y + (stoneHeight / 2))) {
		overlappingStone = item;
	    }
	});
	return overlappingStone;	
    }

    self.findOverlapRight = function(s, x, y) {
	var overlappingStone;
	self.stoneS.forEach(function(item) {
	    if (item == s) return;
	    var bbox = item.getBBox(true);
	    if (x && Raphael.isPointInsideBBox(bbox, x + stoneWidth + stoneGapX, y + (stoneHeight / 2))) {
		overlappingStone = item;
	    }
	});
	return overlappingStone;	
    }

    self.canSlideStoneLeft = function(s, x, y) {
	var bboxRack = self.rack.getBBox(true);
	var bboxStone = s.getBBox(true);

	if (Raphael.isPointInsideBBox(bboxRack, x - stoneWidth - stoneGapX, y + (stoneHeight / 2))) {
	    var overlappingStone = self.findOverlapLeft(s);
	
	    if (overlappingStone) {
		return self.canSlideStone(overlappingStone, x + stoneWidth + stoneGapX, y);
	    } else {
		return true;
	    }
	}
	return false;
    }

    self.canSlideStoneRight = function(s, x, y) {
	var bboxRack = self.rack.getBBox(true);
	var bboxStone = s.getBBox(true);

	if (Raphael.isPointInsideBBox(bboxRack, x + stoneWidth + stoneGapX, y + (stoneHeight / 2))) {
	    var overlappingStone = self.findOverlapRight(s);
	
	    if (overlappingStone) {
		return self.canSlideStone(overlappingStone, x + stoneWidth + stoneGapX, y);
	    } else {
		return true;
	    }
	}
	return false;
    }

    self.fixOverlapStone = function(s, x, y) {
	x = self.gridSnapX(x);
	y = self.rackSnapY(y);
	self.dragStone(s, x, y, true, true);
	
	var overlap = self.findOverlapLeft(s, x, y);
	if (overlap) {
	    if (self.canSlideStoneLeft(overlap, x - stoneWidth + stoneGapX, y))
		self.fixOverlapStone(overlap, x - stoneWidth + stoneGapX, y);
	}
    }

    
    self.draggableStone = function(s, move, start, end) {
	s.drag(function (x, y, event) {
	    self.dragStone(this, this.ox + x, this.oy + y);
	    if (move) move(this);
	}, function() {
	    self.movingStone = this;
	    this.ox = this.attr('x');
	    this.oy = this.attr('y');
	    if (start) start(this);
	}, function () {
	    if (end) end(this);

	    self.movingStone = null;
	});
    }

    
    self.rackSnapY = function(y) {
	if ((y + stoneHeight / 2) > (istakaStartY + istakaHeight / 2 + stoneGapY))
	    y = istakaStartY + (istakaHeight / 2) + stoneGapY;
	else
	    y = istakaStartY;
	return y;
    }

    self.rackSnapX = function(x) {
	if (x < istakaStartX)
	    x = istakaStartX;
	else if (x + stoneWidth + stoneGapX > istakaStartX + istakaWidth) {
	    x = istakaStartX + istakaWidth - stoneWidth - stoneGapX;
	}
	return x;
    }

    self.gridSnapX = function(x) {
	x = self.rackSnapX(x);
	x = Math.max(x - (x % ((stoneWidth + stoneGapX) / 2)), istakaStartX + (stoneWidth / 2) - stoneGapX );
	return x;
    }

    self.snapToRackStone = function(s) {
	var bboxRack = self.rack.getBBox(true);
	var bboxStone = s.getBBox(true);

	// fix y
	var x = s.attr('x');
	var y = s.attr('y');
	x = self.rackSnapX(x);
	y = self.rackSnapY(y);
	self.dragStone(s, x, y, true);

    }


}


