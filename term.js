function Term(width, height, hand) {
    this.w = width;
    this.h = height;
    this.y_base = 0;
    this.x = 0;
    this.y = 0;
    this.cursorstate = 0;
    this.handler = hand;
    this.colors = ["#000", "#f00", "#0f0", "#ff0", "#00f", "#f0f", "#0ff", "#fff"];
    this.def_attr = 7 << 3;
    this.cur_att = this.def_attr;
    this.buffer = "";
}
Term.prototype.open = function () {
    var y, i, ea, c;
    this.lines = new Array();
    this.newline = new Array();
    for (i = 0; i < this.w; i++)
         this.newline[i] = 32 | (this.def_attr << 16);;
    for (y = 0; y < this.h+1; y++)
        this.lines[y] = this.newline.slice();
    for (y = 0; y < this.h; y++)
        $('#terminal').append('<tr><td class="term" id="tline' + y + '"></td></tr>');
    this.refresh(0, this.h - 1);
    $('#terminal').keydown(this.keyDownHandler.bind(this));
    $('#terminal').keypress(this.keyPressHandler.bind(this));
    that = this;
    setInterval(function () {
        that.cursor_timer_cb();
    }, 1000);
};

Term.prototype.refresh = function (y1, y2) {
    var ha, y, html, c, x, cursor_x, mode, lastmode, ay;
    for (y = y1; y <= y2; y++) {
        ay = (y + this.y_base) % this.h;
        html = "";
        cursor_x = (y == this.y && this.cursor_state ) ?  this.x : NaN;
        lastmode = this.def_attr;
        for (x = 0; x < this.w; x++) {
            mode = this.lines[ay][x] >> 16;
            c = this.lines[ay][x] & 0xffff;
            if(cursor_x == x)
            	html += '<span class="termReverse">';
            if(cursor_x == x-1)
            	html += '</span>';	
            if (mode != lastmode) {
                if (lastmode != this.def_attr)
                    html += '</span>';
                if (mode != this.def_attr)
                    html += '<span style="color:' + this.colors[(mode >> 3) & 7] + ';background-color:' + this.colors[mode & 7] + ';">';
            }
            var ttable={
            	32: "&nbsp;",
            	38: "&amp;",
            	60: "&lt;",
            	62: "&gt;",
            };
            html += (ttable[c] || (c<32 ? "&nbsp;" : String.fromCharCode(c)));
            lastmode = mode;
        }
        if (lastmode != this.def_attr) {
            html += '</span>';
        }
       	document.getElementById("tline" + y).innerHTML = html;
    }
};
Term.prototype.cursor_timer_cb = function () {
    this.cursor_state ^= 1;
    this.refresh(this.y, this.y);
};

Term.prototype.show_cursor = function () {
    if (!this.cursor_state) {
        this.cursor_state = 1;
        this.refresh(this.y, this.y);
    }
};

Term.prototype.write = function (string) {
	string=this.buffer+string;
	this.buffer="";
	for(var i=0;i<string.length;i++){
		switch(string.charCodeAt(i)){
		    case 10:  // \n
                        this.y++;
                        break;
                    case 13:  // \r
                        this.x = 0;
                        break;
                    case 8:  // Backspace
                        if (this.x > 0) {
                            this.x--;
                        }
                        break;
                    case 9: // Vertical Tab
                        n = (this.x + 8) & ~7;
                        if (n <= this.w) {
                            this.x = n;
                        }
                        break;
                    case 33:   // ^[
                    	// A Escape sequence. Trying to parse it, in case it is not complete abort and safe the bytes in buffer
                    	// See http://www-user.tu-chemnitz.de/~heha/hs_freeware/terminal/terminal.htm
                    	// http://www.termsys.demon.co.uk/vtansi.htm
                    	// TODO.
                        var complete=false,j=1;
                        if(string[i+1]=='['){
                             if(string[i+2] == 'm'){
                             	this.cur_att = 7 << 3;
                             	complete=true;
                             	j=2;
                             }
                             if(string[i+2] == '0' && string[i+3] == 'm'){
                             	this.cur_att = 7 << 3;
                             	complete=true;
                             	j=3;
                             }
                             if(string[i+4]=='m' && !isNaN(parseInt(string.slice(i+2,i+4)))){
                             	alert("true")
                               	j=4;
                             	var num=parseInt(string.slice(i+2,i+4));
                             	switch(num){
                             		// Text
                             		case 30: // black
                             			this.cur_att &= 7;
                             			this.cur_att |= 0 << 3;
                             			complete = true;
                             			break;
                             		case 31: //
                              			this.cur_att &= 7;
                             			this.cur_att |= 1 << 3;
                             			complete = true;
                             			break;
                             		case 32: //
                             			this.cur_att &= 7;
                             			this.cur_att |= 2 << 3;
                             			complete = true;
                             			break;
                             		case 33:
                             			this.cur_att &= 7;
                             			this.cur_att |= 3 << 3;
                             			complete = true;
                             			break;
                             		case 34:
                             			this.cur_att &= 7;
                             			this.cur_att |= 4 << 3;
                             			complete = true;
                             			break;
                             		case 35:
                             			this.cur_att &= 7;
                             			this.cur_att |= 5 << 3;
                             			complete = true;
                             			break;
                             		case 36:
                             			this.cur_att &= 7;
                             			this.cur_att |= 6 << 3;
                             			complete = true;
                             			break;
                             		case 37:
                             			this.cur_att &= 7;
                             			this.cur_att |= 7 << 3;
                             			complete = true;
                             			break;
                             		// Background
                             		case 40:
		              			this.cur_att &= 7 << 3;
                             			this.cur_att |= 0;
                             			complete = true;
                             			break;
                             		case 41:
		              			this.cur_att &= 7 << 3;
                             			this.cur_att |= 1;
                             			complete = true;
                             			break;
                             		case 42:
		              			this.cur_att &= 7 << 3;
                             			this.cur_att |= 2;
                             			complete = true;
                             			break;
                             		case 43:
		              			this.cur_att &= 7 << 3;
                             			this.cur_att |= 3;
                             			complete = true;
                             			break;
                             		case 44:
		              			this.cur_att &= 7 << 3;
                             			this.cur_att |= 4;
                             			complete = true;
                             			break;
                             		case 45:
		              			this.cur_att &= 7 << 3;
                             			this.cur_att |= 5;
                             			complete = true;
                             			break;
                             		case 46:
		              			this.cur_att &= 7 << 3;
                             			this.cur_att |= 6;
                             			complete = true;
                             			break;
                             		case 47:
		              			this.cur_att &= 7 << 3;
                             			this.cur_att |= 7;
                             			complete = true;
                             			break;
                             	}
                             }
                        }                        
                        if(!complete){
                        	alert("!com    i"+ i + "j"+j+string);
                        	this.buffer=string.slice(i,i+j);
                        }
                        else
                        	i+=j;
                        break;
		    default: // Normal char. Just display.
			this.lines[(this.y + this.y_base)%this.h][this.x++]=string.charCodeAt(i) | this.cur_att << 16;
		}

		if(this.x >= this.w){  // End of Line
			this.x=0;
			this.y++;
		}
		if (this.y >= this.h) {
                        this.y_base++;
                        this.y--;
                        this.lines[(this.y + this.y_base) % this.h]=this.newline.slice();
                        this.refresh(0, this.h-1);
                }
                // -1 bc. otherwise the cursor in the old position at a higher line might be still visible.
                this.refresh(Math.max(0,this.y-1), this.y);
	}
};

Term.prototype.keyDownHandler = function (event) {
    var key;
    // See: http://www.mediaevent.de/javascript/Extras-Javascript-Keycodes.html
    var table = {
        8: "\x7f",
        9: "\t",
        13: "\r",
        27: "\x1b",
        33: "\x1b[5~",
        34: "\x1b[6~",
        35: "\x1bOF",
        36: "\x1bOH",
        37: "\x1b[D",
        38: "\x1b[A",
        39: "\x1b[C",
        40: "\x1b[B",
        45: "\x1b[2~",
        46: "\x1b[3~",
	112: '\x1bOP',
	113: '\x1bOQ',
	114: '\x1bOR',
	115: '\x1bOS',
	116: '\x1b[15~',
	117: '\x1b[17~',
	118: '\x1b[18~',
	119: '\x1b[19~',
	120: '\x1b[20~',
	121: '\x1b[21~',
	122: '\x1b[23~',
	123: '\x1b[24~', 
    };
    key = table[event.keyCode];

    if (event.ctrlKey && event.keyCode >= 65 && event.keyCode <= 90) {
        key = String.fromCharCode(event.keyCode - 64);
    } 
    if (event.altKey || event.metaKey) {
        key = "\x1b" + key;
    }
    if (key) {
        if (event.stopPropagation) event.stopPropagation();
        if (event.preventDefault) event.preventDefault();
        this.show_cursor();
        this.key_rep_state = 1;
        this.handler(key);
        return false;
    } else {
        this.key_rep_state = 0;
        return true;
    }
};


Term.prototype.keyPressHandler = function (event) {
    if (event.stopPropagation) event.stopPropagation();
    if (event.preventDefault) event.preventDefault();
    if (!this.key_rep_state && event.charCode != undefined && event.charCode !=0 && !event.altKey && !event.metaKey) {
        this.show_cursor();
        this.handler(String.fromCharCode(event.charCode));
        return false;
    } else {
        return true;
    }
};
