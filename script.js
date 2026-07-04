/* ============================================================
   CHESS — full game with Gray/White theme set as default
   ============================================================ */

const AI_LEVELS = [
  { name: "Timmy",        desc: "Level 1 - Rookie",   depth: 1, randomness: 1.0,  avatar: "👶" },
  { name: "Chloe",        desc: "Level 2 - Beginner", depth: 1, randomness: 0.7,  avatar: "👧" },
  { name: "Marcus",       desc: "Level 3 - Casual",   depth: 2, randomness: 0.5,  avatar: "👨" },
  { name: "Sarah",        desc: "Level 4 - Amateur",  depth: 2, randomness: 0.3,  avatar: "👩" },
  { name: "David",        desc: "Level 5 - Club",     depth: 2, randomness: 0.15, avatar: "🧔" },
  { name: "Elena",        desc: "Level 6 - Expert",   depth: 3, randomness: 0.1,  avatar: "👱‍♀️" },
  { name: "Victor",       desc: "Level 7 - Master",   depth: 3, randomness: 0.05, avatar: "👴" },
  { name: "Dr. Chess",    desc: "Level 8 - Hard",     depth: 3, randomness: 0,    avatar: "🧑‍🔬" },
  { name: "Grandmaster",  desc: "Level 9 - Extreme",  depth: 4, randomness: 0,    avatar: "🧙‍♂️" },
  { name: "Deep Node",    desc: "Level 10 - God",     depth: 4, randomness: 0,    avatar: "🤖" },
];

const THEMES = [
  { name: "Gray & White", light: "#f5f5f5", dark: "#a9a9a9" }, 
  { name: "Classic",      light: "#f0d9b5", dark: "#b58863" },
  { name: "Emerald",      light: "#eeeed2", dark: "#769656" },
  { name: "Ocean",        light: "#dee3e6", dark: "#788a94" },
  { name: "Midnight",     light: "#9faec1", dark: "#34435e" }
];

const SIDES = [
  { name: "White", value: "w", icon: "♟", className: "piece white" },
  { name: "Black", value: "b", icon: "♟", className: "piece black" },
];

let aiIdx = 0, themeIdx = 0, sideIdx = 0;
let game = null;

const $ = (id) => document.getElementById(id);

function updateMenu() {
  $("aiName").textContent = AI_LEVELS[aiIdx].name;
  $("aiDesc").textContent = AI_LEVELS[aiIdx].desc;
  $("aiAvatar").textContent = AI_LEVELS[aiIdx].avatar;
  
  $("themeName").textContent = THEMES[themeIdx].name;
  
  $("sideName").textContent = SIDES[sideIdx].name;
  const sideAvatar = $("sideAvatar");
  sideAvatar.textContent = SIDES[sideIdx].icon;
  sideAvatar.className = "avatar-emoji " + SIDES[sideIdx].className;

  const t = THEMES[themeIdx];
  document.documentElement.style.setProperty("--light", t.light);
  document.documentElement.style.setProperty("--dark", t.dark);
}
const cycle = (i, n, d) => (i + d + n) % n;

$("aiPrev").onclick    = () => { aiIdx = cycle(aiIdx, AI_LEVELS.length, -1); updateMenu(); };
$("aiNext").onclick    = () => { aiIdx = cycle(aiIdx, AI_LEVELS.length, +1); updateMenu(); };
$("themePrev").onclick = () => { themeIdx = cycle(themeIdx, THEMES.length, -1); updateMenu(); };
$("themeNext").onclick = () => { themeIdx = cycle(themeIdx, THEMES.length, +1); updateMenu(); };
$("sidePrev").onclick  = () => { sideIdx = cycle(sideIdx, SIDES.length, -1); updateMenu(); };
$("sideNext").onclick  = () => { sideIdx = cycle(sideIdx, SIDES.length, +1); updateMenu(); };

$("startBtn").onclick = () => {
  $("menu").classList.remove("active");
  $("game").classList.add("active");
  $("gameAiName").textContent = AI_LEVELS[aiIdx].name;
  $("gameAiAvatar").textContent = AI_LEVELS[aiIdx].avatar;
  game = new ChessGame(AI_LEVELS[aiIdx], SIDES[sideIdx].value);
  game.render();
  if (game.turn !== game.playerColor) setTimeout(() => game.aiMove(), 500);
};
$("backBtn").onclick = goMenu;
$("resignBtn").onclick = () => game && game.resign();
$("endMenuBtn").onclick = () => { $("endModal").classList.add("hidden"); goMenu(); };
$("endRematchBtn").onclick = () => {
  $("endModal").classList.add("hidden");
  game = new ChessGame(AI_LEVELS[aiIdx], SIDES[sideIdx].value);
  game.render();
  if (game.turn !== game.playerColor) setTimeout(() => game.aiMove(), 500);
};

// Credits Modal Logic
$("openCreditsBtn").onclick = () => $("creditsModal").classList.remove("hidden");
$("closeCreditsBtn").onclick = () => $("creditsModal").classList.add("hidden");

function goMenu() {
  $("game").classList.remove("active");
  $("menu").classList.add("active");
  game = null;
}

updateMenu();

/* ============================================================
   CHESS ENGINE
   ============================================================ */

const PIECE_UNICODE = {
  w: { k:"♚",q:"♛",r:"♜",b:"♝",n:"♞",p:"♟" },
  b: { k:"♚",q:"♛",r:"♜",b:"♝",n:"♞",p:"♟" }
};

const PIECE_VALUE = { p:100, n:320, b:330, r:500, q:900, k:20000 };

const PST = {
  p: [[0,0,0,0,0,0,0,0],[50,50,50,50,50,50,50,50],[10,10,20,30,30,20,10,10],
      [5,5,10,25,25,10,5,5],[0,0,0,20,20,0,0,0],[5,-5,-10,0,0,-10,-5,5],
      [5,10,10,-20,-20,10,10,5],[0,0,0,0,0,0,0,0]],
  n: [[-50,-40,-30,-30,-30,-30,-40,-50],[-40,-20,0,0,0,0,-20,-40],
      [-30,0,10,15,15,10,0,-30],[-30,5,15,20,20,15,5,-30],
      [-30,0,15,20,20,15,0,-30],[-30,5,10,15,15,10,5,-30],
      [-40,-20,0,5,5,0,-20,-40],[-50,-40,-30,-30,-30,-30,-40,-50]],
  b: [[-20,-10,-10,-10,-10,-10,-10,-20],[-10,0,0,0,0,0,0,-10],
      [-10,0,5,10,10,5,0,-10],[-10,5,5,10,10,5,5,-10],
      [-10,0,10,10,10,10,0,-10],[-10,10,10,10,10,10,10,-10],
      [-10,5,0,0,0,0,5,-10],[-20,-10,-10,-10,-10,-10,-10,-20]],
  r: [[0,0,0,0,0,0,0,0],[5,10,10,10,10,10,10,5],[-5,0,0,0,0,0,0,-5],
      [-5,0,0,0,0,0,0,-5],[-5,0,0,0,0,0,0,-5],[-5,0,0,0,0,0,0,-5],
      [-5,0,0,0,0,0,0,-5],[0,0,0,5,5,0,0,0]],
  q: [[-20,-10,-10,-5,-5,-10,-10,-20],[-10,0,0,0,0,0,0,-10],
      [-10,0,5,5,5,5,0,-10],[-5,0,5,5,5,5,0,-5],
      [0,0,5,5,5,5,0,-5],[-10,5,5,5,5,5,0,-10],
      [-10,0,5,0,0,0,0,-10],[-20,-10,-10,-5,-5,-10,-10,-20]],
  k: [[-30,-40,-40,-50,-50,-40,-40,-30],[-30,-40,-40,-50,-50,-40,-40,-30],
      [-30,-40,-40,-50,-50,-40,-40,-30],[-30,-40,-40,-50,-50,-40,-40,-30],
      [-20,-30,-30,-40,-40,-30,-30,-20],[-10,-20,-20,-20,-20,-20,-20,-10],
      [20,20,0,0,0,0,20,20],[20,30,10,0,0,10,30,20]],
};

class ChessGame {
  constructor(ai, playerColor) {
    this.ai = ai;
    this.playerColor = playerColor;
    this.aiColor = playerColor === "w" ? "b" : "w";
    this.board = this.initBoard();
    this.turn = "w";
    this.selected = null;
    this.legalForSelected = [];
    this.enPassant = null; 
    this.castling = { wK:true,wQ:true,bK:true,bQ:true };
    this.halfmove = 0;
    this.history = [];
    this.positionCounts = {};
    this.lastMove = null;
    this.gameOver = false;
    this.capturedByPlayer = []; 
    this.capturedByAI = [];     
    this.pendingPromotion = null;
    this.animating = false;
    this.boardEl = $("board");
    this.boardEl.onclick = (e) => this.onClick(e);
    this.recordPosition();
  }

  initBoard() {
    const b = Array.from({length:8},()=>Array(8).fill(null));
    const back = ["r","n","b","q","k","b","n","r"];
    for (let c=0;c<8;c++) {
      b[0][c] = { type:back[c], color:"b", moved:false };
      b[1][c] = { type:"p", color:"b", moved:false };
      b[6][c] = { type:"p", color:"w", moved:false };
      b[7][c] = { type:back[c], color:"w", moved:false };
    }
    return b;
  }

  render() {
    this.boardEl.innerHTML = "";
    const flip = this.playerColor === "b";
    const kingPos = this.findKing(this.turn);
    const inCheck = this.isSquareAttacked(kingPos.r, kingPos.c, this.turn === "w" ? "b" : "w");
    
    for (let i=0;i<8;i++) {
      for (let j=0;j<8;j++) {
        const r = flip ? 7-i : i;
        const c = flip ? 7-j : j;
        const sq = document.createElement("div");
        sq.className = "sq " + (((r+c)%2===0) ? "light" : "dark");
        sq.dataset.r = r; sq.dataset.c = c;
        
        if (this.selected && this.selected.r===r && this.selected.c===c) sq.classList.add("selected");
        if (this.lastMove && ((this.lastMove.from.r===r&&this.lastMove.from.c===c)||(this.lastMove.to.r===r&&this.lastMove.to.c===c))) {
            sq.classList.add("last");
        }
        
        const mv = this.legalForSelected.find(m=>m.to.r===r&&m.to.c===c);
        if (mv) sq.classList.add(this.board[r][c] || mv.enPassant ? "move-capture" : "move-dot");
        
        const p = this.board[r][c];
        if (p && !p.hiddenForAnimation) {
          const span = document.createElement("span");
          span.className = "piece " + (p.color==="w"?"white":"black");
          span.textContent = PIECE_UNICODE[p.color][p.type];
          sq.appendChild(span);
        }
        if (inCheck && kingPos.r===r && kingPos.c===c) sq.classList.add("check");
        this.boardEl.appendChild(sq);
      }
    }

    $("turnIndicator").textContent = this.gameOver ? "Game over" :
      (this.turn === this.playerColor ? "Your turn" : `${this.ai.name}'s turn`);
      
    const playerPieceColor = this.playerColor === "w" ? "b" : "w"; 
    const aiPieceColor = this.aiColor === "w" ? "b" : "w"; 
    
    $("playerCaptures").innerHTML = this.capturedByPlayer.map(p => 
      `<span class="piece ${playerPieceColor==="w"?"white":"black"}">${PIECE_UNICODE[playerPieceColor][p]}</span>`
    ).join("");
    
    $("aiCaptures").innerHTML = this.capturedByAI.map(p => 
      `<span class="piece ${aiPieceColor==="w"?"white":"black"}">${PIECE_UNICODE[aiPieceColor][p]}</span>`
    ).join("");
  }

  animateMove(move, onComplete) {
    this.animating = true;
    const piece = this.board[move.from.r][move.from.c];
    const flip = this.playerColor === "b";
    
    const sr = flip ? 7 - move.from.r : move.from.r;
    const sc = flip ? 7 - move.from.c : move.from.c;
    const er = flip ? 7 - move.to.r : move.to.r;
    const ec = flip ? 7 - move.to.c : move.to.c;

    const flier = document.createElement("div");
    flier.className = "piece " + (piece.color === "w" ? "white" : "black");
    flier.textContent = PIECE_UNICODE[piece.color][piece.type];
    
    Object.assign(flier.style, {
      position: "absolute",
      width: "12.5%", height: "12.5%",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: "min(8vw, 8vh, 60px)",
      left: (sc * 12.5) + "%", top: (sr * 12.5) + "%",
      zIndex: "100",
      transition: "all 0.3s cubic-bezier(0.25, 1, 0.5, 1)"
    });
    
    piece.hiddenForAnimation = true; 
    this.render();
    this.boardEl.appendChild(flier);

    setTimeout(() => {
       flier.style.left = (ec * 12.5) + "%";
       flier.style.top = (er * 12.5) + "%";
    }, 10);

    setTimeout(() => {
       flier.remove();
       piece.hiddenForAnimation = false;
       this.animating = false;
       onComplete();
    }, 300);
  }

  onClick(e) {
    if (this.gameOver || this.pendingPromotion || this.animating) return;
    if (this.turn !== this.playerColor) return;
    const sq = e.target.closest(".sq");
    if (!sq) return;
    const r = +sq.dataset.r, c = +sq.dataset.c;
    
    if (this.selected) {
      const move = this.legalForSelected.find(m=>m.to.r===r&&m.to.c===c);
      if (move) {
        this.animateMove(move, () => {
           this.makeMove(move, () => {
             this.selected = null; this.legalForSelected = [];
             this.render();
             if (!this.gameOver && this.turn === this.aiColor) {
               setTimeout(() => this.aiMove(), 250); 
             }
           });
        });
        return;
      }
    }
    
    const p = this.board[r][c];
    if (p && p.color === this.turn) {
      this.selected = {r,c};
      this.legalForSelected = this.legalMovesFor(r,c);
      this.render();
    } else {
      this.selected = null;
      this.legalForSelected = [];
      this.render();
    }
  }

  inBounds(r,c){ return r>=0&&r<8&&c>=0&&c<8; }

  pseudoMovesFor(r,c, board=this.board, enPassant=this.enPassant) {
    const p = board[r][c];
    if (!p) return [];
    const moves = [];
    const dir = p.color === "w" ? -1 : 1;
    const startRow = p.color === "w" ? 6 : 1;
    const enemy = p.color === "w" ? "b" : "w";
    const add = (tr,tc, extra={}) => moves.push({from:{r,c},to:{r:tr,c:tc},...extra});

    if (p.type === "p") {
      if (this.inBounds(r+dir,c) && !board[r+dir][c]) {
        add(r+dir,c);
        if (r === startRow && !board[r+2*dir][c]) add(r+2*dir,c,{double:true});
      }
      for (const dc of [-1,1]) {
        const tr=r+dir, tc=c+dc;
        if (!this.inBounds(tr,tc)) continue;
        if (board[tr][tc] && board[tr][tc].color===enemy) add(tr,tc);
        else if (enPassant && enPassant.r===tr && enPassant.c===tc) add(tr,tc,{enPassant:true});
      }
    } else if (p.type === "n") {
      for (const [dr,dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
        const tr=r+dr,tc=c+dc;
        if (this.inBounds(tr,tc) && (!board[tr][tc] || board[tr][tc].color===enemy)) add(tr,tc);
      }
    } else if (p.type === "k") {
      for (let dr=-1;dr<=1;dr++) for (let dc=-1;dc<=1;dc++) {
        if (!dr && !dc) continue;
        const tr=r+dr,tc=c+dc;
        if (this.inBounds(tr,tc) && (!board[tr][tc] || board[tr][tc].color===enemy)) add(tr,tc);
      }
      if (board === this.board && !p.moved) {
        const row = p.color === "w" ? 7 : 0;
        if (r===row && c===4) {
          const opp = p.color==="w"?"b":"w";
          const rkK = board[row][7];
          if (rkK && rkK.type==="r" && !rkK.moved && !board[row][5] && !board[row][6]
              && !this.isSquareAttacked(row,4,opp) && !this.isSquareAttacked(row,5,opp) && !this.isSquareAttacked(row,6,opp)) {
            add(row,6,{castle:"K"});
          }
          const rkQ = board[row][0];
          if (rkQ && rkQ.type==="r" && !rkQ.moved && !board[row][1] && !board[row][2] && !board[row][3]
              && !this.isSquareAttacked(row,4,opp) && !this.isSquareAttacked(row,3,opp) && !this.isSquareAttacked(row,2,opp)) {
            add(row,2,{castle:"Q"});
          }
        }
      }
    } else {
      const dirs = {
        r: [[-1,0],[1,0],[0,-1],[0,1]],
        b: [[-1,-1],[-1,1],[1,-1],[1,1]],
        q: [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]],
      }[p.type];
      for (const [dr,dc] of dirs) {
        let tr=r+dr, tc=c+dc;
        while (this.inBounds(tr,tc)) {
          if (!board[tr][tc]) { add(tr,tc); }
          else { if (board[tr][tc].color===enemy) add(tr,tc); break; }
          tr+=dr; tc+=dc;
        }
      }
    }
    return moves;
  }

  isSquareAttacked(r,c,byColor,board=this.board) {
    const dir = byColor === "w" ? 1 : -1; 
    for (const dc of [-1,1]) {
      const pr = r+dir, pc = c+dc;
      if (this.inBounds(pr,pc)) {
        const p = board[pr][pc];
        if (p && p.color===byColor && p.type==="p") return true;
      }
    }
    for (const [dr,dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
      const tr=r+dr,tc=c+dc;
      if (this.inBounds(tr,tc)) {
        const p=board[tr][tc];
        if (p && p.color===byColor && p.type==="n") return true;
      }
    }
    for (let dr=-1;dr<=1;dr++) for (let dc=-1;dc<=1;dc++) {
      if (!dr && !dc) continue;
      const tr=r+dr,tc=c+dc;
      if (this.inBounds(tr,tc)) {
        const p=board[tr][tc];
        if (p && p.color===byColor && p.type==="k") return true;
      }
    }
    const rays = [
      {dirs:[[-1,0],[1,0],[0,-1],[0,1]], types:["r","q"]},
      {dirs:[[-1,-1],[-1,1],[1,-1],[1,1]], types:["b","q"]},
    ];
    for (const {dirs,types} of rays) {
      for (const [dr,dc] of dirs) {
        let tr=r+dr,tc=c+dc;
        while (this.inBounds(tr,tc)) {
          const p=board[tr][tc];
          if (p) {
            if (p.color===byColor && types.includes(p.type)) return true;
            break;
          }
          tr+=dr; tc+=dc;
        }
      }
    }
    return false;
  }

  findKing(color, board=this.board) {
    for (let r=0;r<8;r++) for (let c=0;c<8;c++) {
      const p=board[r][c];
      if (p && p.type==="k" && p.color===color) return {r,c};
    }
    return {r:-1,c:-1};
  }

  legalMovesFor(r,c) {
    const moves = this.pseudoMovesFor(r,c);
    return moves.filter(m => this.isLegalMove(m));
  }

  isLegalMove(move) {
    const piece = this.board[move.from.r][move.from.c];
    if (!piece) return false;
    const snap = this.snapshot();
    this.applyMoveInternal(move, true);
    const kingPos = this.findKing(piece.color);
    const enemy = piece.color==="w"?"b":"w";
    const inCheck = this.isSquareAttacked(kingPos.r, kingPos.c, enemy);
    this.restore(snap);
    return !inCheck;
  }

  allLegalMoves(color) {
    const all = [];
    for (let r=0;r<8;r++) for (let c=0;c<8;c++) {
      const p=this.board[r][c];
      if (p && p.color===color) {
        for (const m of this.legalMovesFor(r,c)) all.push(m);
      }
    }
    return all;
  }

  snapshot() {
    return {
      board: this.board.map(row => row.map(p => p ? {...p} : null)),
      turn: this.turn,
      enPassant: this.enPassant ? {...this.enPassant} : null,
      castling: {...this.castling},
      halfmove: this.halfmove,
      lastMove: this.lastMove ? JSON.parse(JSON.stringify(this.lastMove)) : null,
    };
  }
  restore(s) {
    this.board = s.board;
    this.turn = s.turn;
    this.enPassant = s.enPassant;
    this.castling = s.castling;
    this.halfmove = s.halfmove;
    this.lastMove = s.lastMove;
  }

  applyMoveInternal(move, simulate=false, promotionPiece="q") {
    const piece = this.board[move.from.r][move.from.c];
    const target = this.board[move.to.r][move.to.c];
    let captured = null;

    if (move.enPassant) {
      const capRow = move.from.r;
      captured = this.board[capRow][move.to.c];
      this.board[capRow][move.to.c] = null;
    } else if (target) {
      captured = target;
    }

    this.board[move.to.r][move.to.c] = { ...piece, moved:true };
    this.board[move.from.r][move.from.c] = null;

    if (move.castle) {
      const row = move.to.r;
      if (move.castle === "K") {
        this.board[row][5] = { ...this.board[row][7], moved:true };
        this.board[row][7] = null;
      } else {
        this.board[row][3] = { ...this.board[row][0], moved:true };
        this.board[row][0] = null;
      }
    }

    if (piece.type === "p" && (move.to.r === 0 || move.to.r === 7)) {
      this.board[move.to.r][move.to.c].type = simulate ? "q" : promotionPiece;
      move._promoted = true;
    }

    this.enPassant = null;
    if (piece.type === "p" && Math.abs(move.to.r - move.from.r) === 2) {
      this.enPassant = { r: (move.from.r + move.to.r)/2, c: move.from.c };
    }

    if (piece.type === "k") {
      if (piece.color === "w") { this.castling.wK = false; this.castling.wQ = false; }
      else { this.castling.bK = false; this.castling.bQ = false; }
    }
    if (piece.type === "r") {
      if (piece.color==="w" && move.from.r===7 && move.from.c===0) this.castling.wQ=false;
      if (piece.color==="w" && move.from.r===7 && move.from.c===7) this.castling.wK=false;
      if (piece.color==="b" && move.from.r===0 && move.from.c===0) this.castling.bQ=false;
      if (piece.color==="b" && move.from.r===0 && move.from.c===7) this.castling.bK=false;
    }
    if (captured && captured.type === "r") {
      if (captured.color==="w" && move.to.r===7 && move.to.c===0) this.castling.wQ=false;
      if (captured.color==="w" && move.to.r===7 && move.to.c===7) this.castling.wK=false;
      if (captured.color==="b" && move.to.r===0 && move.to.c===0) this.castling.bQ=false;
      if (captured.color==="b" && move.to.r===0 && move.to.c===7) this.castling.bK=false;
    }

    if (piece.type === "p" || captured) this.halfmove = 0;
    else this.halfmove++;

    this.turn = this.turn === "w" ? "b" : "w";
    move._captured = captured;
    this.lastMove = move;
  }

  makeMove(move, done) {
    const piece = this.board[move.from.r][move.from.c];
    const isPromotion = piece.type==="p" && (move.to.r===0 || move.to.r===7);
    
    const finalize = (promo="q") => {
      this.applyMoveInternal(move, false, promo);
      if (move._captured) {
        if (piece.color === this.playerColor) {
            this.capturedByPlayer.push(move._captured.type);
        } else {
            this.capturedByAI.push(move._captured.type);
        }
      }
      this.recordPosition();
      this.checkEnd();
      if (done) done();
    };
    
    if (isPromotion && piece.color === this.playerColor) {
      this.pendingPromotion = true;
      const modal = $("promotion");
      modal.classList.remove("hidden");
      modal.querySelectorAll(".promo").forEach(btn => {
        btn.onclick = () => {
          modal.classList.add("hidden");
          this.pendingPromotion = false;
          finalize(btn.dataset.piece);
        };
      });
    } else {
      finalize("q");
    }
  }

  recordPosition() {
    const key = this.positionKey();
    this.positionCounts[key] = (this.positionCounts[key] || 0) + 1;
  }
  positionKey() {
    let s = "";
    for (let r=0;r<8;r++) for (let c=0;c<8;c++) {
      const p=this.board[r][c];
      s += p ? p.color+p.type : "..";
    }
    s += this.turn + JSON.stringify(this.castling) + (this.enPassant?`${this.enPassant.r}${this.enPassant.c}`:"-");
    return s;
  }

  checkEnd() {
    const legal = this.allLegalMoves(this.turn);
    const kingPos = this.findKing(this.turn);
    const enemy = this.turn==="w"?"b":"w";
    const inCheck = this.isSquareAttacked(kingPos.r, kingPos.c, enemy);
    if (legal.length === 0) {
      this.gameOver = true;
      if (inCheck) {
        const winner = this.turn === "w" ? "Black" : "White";
        this.endGame("Checkmate", `${winner} wins by checkmate.`);
      } else {
        this.endGame("Stalemate", "Draw by stalemate.");
      }
      return;
    }
    if (this.halfmove >= 100) { this.gameOver=true; this.endGame("Draw","Draw by 50-move rule."); return; }
    if (this.positionCounts[this.positionKey()] >= 3) { this.gameOver=true; this.endGame("Draw","Draw by threefold repetition."); return; }
    if (this.isInsufficientMaterial()) { this.gameOver=true; this.endGame("Draw","Draw by insufficient material."); return; }
  }

  isInsufficientMaterial() {
    const pieces = [];
    for (let r=0;r<8;r++) for (let c=0;c<8;c++) {
      const p=this.board[r][c];
      if (p && p.type!=="k") pieces.push(p);
    }
    if (pieces.length === 0) return true;
    if (pieces.length === 1 && (pieces[0].type==="b"||pieces[0].type==="n")) return true;
    if (pieces.length === 2 && pieces.every(p=>p.type==="b")) return false;
    return false;
  }

  endGame(title, msg) {
    setTimeout(() => {
      this.render();
      $("endTitle").textContent = title;
      $("endMessage").textContent = msg;
      $("endModal").classList.remove("hidden");
    }, 400);
  }

  resign() {
    if (this.gameOver) return;
    this.gameOver = true;
    const winner = this.playerColor === "w" ? "Black" : "White";
    this.endGame("Resigned", `${winner} wins by resignation.`);
  }

  aiMove() {
    if (this.gameOver) return;
    this.render();
    const moves = this.allLegalMoves(this.aiColor);
    if (!moves.length) { this.checkEnd(); return; }

    let chosen;
    if (Math.random() < this.ai.randomness) {
      chosen = moves[Math.floor(Math.random()*moves.length)];
    } else {
      chosen = this.findBestMove(this.ai.depth);
      if (!chosen) chosen = moves[Math.floor(Math.random()*moves.length)];
    }
    
    this.animateMove(chosen, () => {
       this.makeMove(chosen, () => this.render());
    });
  }

  evaluate() {
    let score = 0;
    for (let r=0;r<8;r++) for (let c=0;c<8;c++) {
      const p=this.board[r][c];
      if (!p) continue;
      const val = PIECE_VALUE[p.type];
      const pst = PST[p.type];
      const psv = p.color==="w" ? pst[r][c] : pst[7-r][c];
      const sign = p.color === this.aiColor ? 1 : -1;
      score += sign * (val + psv);
    }
    return score;
  }

  findBestMove(depth) {
    let bestMove = null;
    let bestScore = -Infinity;
    const moves = this.orderMoves(this.allLegalMoves(this.aiColor));
    for (const move of moves) {
      const snap = this.snapshot();
      this.applyMoveInternal(move, true);
      const score = -this.negamax(depth-1, -Infinity, Infinity, this.aiColor==="w"?"b":"w");
      this.restore(snap);
      if (score > bestScore) { bestScore = score; bestMove = move; }
    }
    return bestMove;
  }

  negamax(depth, alpha, beta, sideToMove) {
    if (depth === 0) {
      return sideToMove === this.aiColor ? this.evaluate() : -this.evaluate();
    }
    const moves = this.orderMoves(this.allLegalMoves(sideToMove));
    if (!moves.length) {
      const kingPos = this.findKing(sideToMove);
      const enemy = sideToMove === "w" ? "b" : "w";
      if (this.isSquareAttacked(kingPos.r, kingPos.c, enemy)) return -100000 + (10 - depth);
      return 0;
    }
    let best = -Infinity;
    for (const move of moves) {
      const snap = this.snapshot();
      this.applyMoveInternal(move, true);
      const score = -this.negamax(depth-1, -beta, -alpha, sideToMove==="w"?"b":"w");
      this.restore(snap);
      if (score > best) best = score;
      if (best > alpha) alpha = best;
      if (alpha >= beta) break;
    }
    return best;
  }

  orderMoves(moves) {
    return moves.map(m => {
      const t = this.board[m.to.r][m.to.c];
      const score = t ? 10*PIECE_VALUE[t.type] - PIECE_VALUE[this.board[m.from.r][m.from.c].type] : 0;
      return {m, score};
    }).sort((a,b)=>b.score-a.score).map(x=>x.m);
  }
}
