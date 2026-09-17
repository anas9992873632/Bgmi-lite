/*
 GAMEPIX AI
 NOTE: This is the current script structure from the public repository.
 The repository's current script is incomplete; the original 55+ game
 definitions and 60+ filter definitions are not present in the current file.
*/
function tttGame() {
  let board = Array(9).fill('');
  const stage = document.getElementById('gameStage');
  if (!stage) return;
  stage.innerHTML = `
    <div class="game-ui">
      <div class="game-top"><h2>Tic Tac Toe</h2><div class="score-box">You: X</div></div>
      <div id="tttBoard" class="ttt"></div>
      <p id="tttResult" class="game-message"></p>
    </div>`;
  const grid = document.getElementById('tttBoard');
  function winner() {
    const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for (const [a,b,c] of lines) if (board[a] && board[a]===board[b] && board[a]===board[c]) return board[a];
    return board.every(Boolean) ? 'draw' : null;
  }
  function render() {
    grid.innerHTML='';
    board.forEach((v,i)=>{
      const b=document.createElement('button');
      b.textContent=v;
      b.onclick=()=>{
        if(board[i]||winner()) return;
        board[i]='X';
        let w=winner();
        if(!w){
          const empty=board.map((x,j)=>x?null:j).filter(x=>x!==null);
          if(empty.length) board[empty[Math.floor(Math.random()*empty.length)]]='O';
          w=winner();
        }
        render();
        if(w) document.getElementById('tttResult').textContent=w==='draw'?'🤝 Draw!':`🏆 ${w} Wins!`;
      };
      grid.appendChild(b);
    });
  }
  render();
}
