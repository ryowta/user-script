// ==UserScript==

//タイピングワード表示の処理高速化・不具合修正・MODの処理最適化ため

//プレイ中の処理
//playheadupdate()、keydownfunc(event)、keypressfunc_kana()、keydownfunc_kana(),clearForNextString()、update_status()、checkNextChar()、checkNextKana()

//プレイ前準備処理
//onPlayerReady()、parseRomaMap(),parseLyrics(),hiraganaToRomaArray()、getScorePerChar()、onPlayerStateChange()


//プレイ終了時処理
//stop_movie(),finish_movie()


//以上の関数を書き換えています。
//このスクリプトの適応時は書き換えた関数が優先して発動されているので注意をお願いします。


// @name          Typing Tube MOD official
// @namespace    https://typing-tube.net/
// @version      32.1.4
// @description  try to take over the world!
// @author       Toshi
// @match        https://typing-tube.net/movie/show/*?*test=test*
// @match        https://typing-tube.net/movie/typing/*?*test=test*
// @noframes
// @run-at document-end


// ==/UserScript==

//MOD設定メニューの左上に表示するバージョン表記
//マイナーバージョン以上の数値を更新する場合はこちらも更新する
const VERSION = '<span style="float: right;color: #FFFFFF33;text-align: end;padding-right: 5px;">ver 32.1</span>';
const PHONE_FLAG = navigator.userAgent.match(/(iPhone|iPod|iPad|Android.*Mobile)/i);
const IOS_FLAG = navigator.userAgent.match(/(iPhone|iPod|iPad)/i);



/**
 * MODを適用する上で不要な静的要素を削除 及び 動画上のアイコンボタンのコンテナを作成
 * @param {Number}
 * @type {Array}
 */
{
	//不要な要素を削除
	document.getElementById("modal-open").removeAttribute("id");
	const SHARE_SELECTOR_CHILD_P_TAG = document.getElementsByClassName("share")[0].getElementsByTagName("p");
	for(let i=0;i<SHARE_SELECTOR_CHILD_P_TAG.length;i++){
		if(!SHARE_SELECTOR_CHILD_P_TAG[i].childElementCount){
			SHARE_SELECTOR_CHILD_P_TAG[i].remove();
			i--;
		};
	};
	document.getElementsByClassName("share")[0].getElementsByTagName("br")[0].remove();

	/////////////////////////////////////////////////////////////////////////////////////////////////////////

	//動画上のアイコンボタンのコンテナを作成
	SHARE_SELECTOR_CHILD_P_TAG[0].insertAdjacentHTML("afterend" , "<span id=btn_container></span>");
	document.getElementById("btn_container").appendChild(document.getElementsByClassName("share")[0].getElementsByTagName("p")[0]);
}








/////////////////////////////////////////////////////////////////////////////////////////////////
/**
*@ページを開いたときのMOD追加機能処理 ここから---
*/

/**
 * @type {DOM} CONTROLBOX_SELECTOR - タイピングプレイエリア
 * @type {DOM} lineClearRateSelector - 記号省略設定有効時に省略される記号一覧の説明文。
 * @type {DOM} lineClearGauge80RateLessThanSelector - ラインクリアゲージ80%未満。
 * @type {DOM} lineClearGauge80RateMoreThanSelector - ラインクリアゲージ80%以上。
 * @type {DOM} romaModeConfig  - ローマ字入力モードが有効の時に表示される設定。
 * @type {DOM} kanaModeConfig -  かな入力モードが有効の時に表示される設定。
 * @type {DOM} gauge_html_save  - ラインクリア率ゲージの曲のやり直し時に置き換えるコピーDOM。
 */
const CONTROLBOX_SELECTOR = document.getElementById("controlbox");
CONTROLBOX_SELECTOR.style.paddingBottom = "6px";
let lineClearRateSelector , lineClearGauge80RateLessThanSelector , lineClearGauge80RateMoreThanSelector;
let kanaModeConfig , romaModeConfig;
let gauge_html_save //削除予定

(function add_dom(){
	/**
     * @type {String} FOLDED_RULED_LINE - タイピングゲームの設定フォーム内で使用する折れ罫線。
     * @type {Array} DISABLE_SYMBOL_LIST - 記号省略設定有効時に省略される記号一覧の説明文。
     * @type {Array} VALID_SYMBOL_LIST - 記号省略設定有効時でも省略されない記号一覧の説明文。
     * @type {DOM} MOD_SETTINGS_MENU  - 動画上部の歯車アイコンをクリックすると表示されるタイピングゲームの設定フォーム。
     */
	addCss()
	const FOLDED_RULED_LINE = '<span class="folded-luled-line">└</span>';
	const DISABLE_SYMBOL_LIST = [":; (コロン,セミコロン)","!? (疑問符,感嘆符)","[](){}<>「」『』 (括弧系)","_・| (アンダーバー,中点,パイプライン)","”'`^ (クォーテーション&アポストロフィ系,キャロット)","、。,. (句読点,カンマ,ピリオド　※数字の直後のピリオドは省略されません)","～~- (全角チルダ,半角チルダ,ハイフン　※全角チルダは長音符[ー]に変換されます/アルファベット&スペース直後のハイフンのみ省略されます。)"].join("\n");
	const VALID_SYMBOL_LIST = ["ー(長音符)","￥","＆", "％","＠", "＃", "＄","＊", "＋","＝","数字直後のピリオド","アルファベット&スペース直後以外のハイフン"];

	const MOD_SETTINGS_MENU = document.createElement('form');
	MOD_SETTINGS_MENU.setAttribute("id", "mod-menu");
	MOD_SETTINGS_MENU.setAttribute("style", "color:#fff; z-index:102;display:none;position:fixed;word-break: break-all;max-height: 900px;background-color: rgba(0,0,0,0.96);right:0px;top:70px;");
	MOD_SETTINGS_MENU.innerHTML=
 `<input id="all" type="radio" name="tab-item" checked>
  <label class="tab-item" for="all">入力</label>
  <input id="design" type="radio" name="tab-item">
  <label class="tab-item" for="design">エフェクト</label>
  <input id="playcolor" type="radio" name="tab-item">
  <label class="tab-item" for="playcolor">配色</label>
  <input id="etc" type="radio" name="tab-item">
  <label class="tab-item" for="etc">その他</label>
  <div class="mod-tab-content" id="all-content">
    <div class="mod-tab-content-description">${VERSION}
      <button type="button" id="osusume" style="position:absolute;right:130px;bottom:10px;margin-right:5px;z-index:3;background:#333;" class="btn btn-light">おすすめ設定</button>
      <div id="roma-mode-config" style="display:none;">
        <h6>ローマ字入力設定</h6>
        <label title="かな表示モードは大文字ローマ字。ローマ字表示モードはかな表示が表示されます。">
          <input class="during-play-option" type="checkbox" name="sub" checked>
          <span id="roma-sub-display" style="display:none;">ローマ字文</span>
          <span id="kana-sub-display" style="display:none;">ひらがな文</span>を表示</label>
        <label title="「促音」例:「った」を「ltuta や xtuta」「拗音」例:「しゃ」を「silya や sixya」。等の打鍵数が多くなる入力を受け付けなくします。少ない打鍵数で入力出来るようにしたい方におすすめです。">
          <input class="during-play-option" type="checkbox" name="sokuon-yoon-disable">促音・拗音の入力パターンを最適化</label>
      </div>
      <div id="kana-mode-config" style="display:none;margin: 0 10px 0 10px;">
        <h6>かな入力 / フリック入力設定</h6>
        <label id="kana-daku-handaku-split-setting-label" title="ONにすると「ば、ぱ、が、だ」→「は゛、は゜、か゛、た゛」のように濁点・半濁点が別れてタイピングワードに表示されます。">
          <input class="during-play-option" type="checkbox" name="dakuten-handakuten-split-mode">濁点・半濁点を分けて表示</label>
      </div>
      <div id="limits-config">
        <h6>制限モード</h6>
        <label style="display:inline-block;" title="以下の記号とスペースを省略します。\省略した文字数分、最大スコアが低くなります。\n\n省略記号一覧\n ${DISABLE_SYMBOL_LIST} \n\n省略しない記号一覧\n ${VALID_SYMBOL_LIST} ">
          <input type="checkbox" name="space-symbol-omit">スペース・記号を省略</label>
        <label style="display:none;" id="space-trace" display:none title="記号省略時に作られる文字間の余白を無効化します。">
          <input type="checkbox" name="margin-space-disable">文字間の余白を無効化</label>
        <label title="アルファベット大文字がタイピングワードに出現するようになります。SHIFTキーやCapsLockを使用して大文字を入力してください。">
          <input class="during-play-option" type="checkbox" name="case-sensitive-mode">アルファベット大文字を入力する</label>
        <label title="正確率に制限をかけるモードです。指定した正確率より下回ると動画が強制終了します。タイピングの正確性を上げる目標設定です。">
          <input class="during-play-option" type="checkbox" name="miss-limit-mode">ミス制限モード</label>
        <div id="miss-limit-mode-config" style="display:none;">${FOLDED_RULED_LINE}
          <label class="miss-limit-correct">目標正確率
            <input class="three-digits during-play-option" type="number" name="miss-limit-correct" value="95" min="0" max="100">%</label>
          <label title="目標正確率を下回った瞬間にゲームオーバーになります。玄人向け">
            <input class="during-play-option" type="radio" name="miss-limit-game-mode" value="keep-correct-mode">正確率を維持</label>
          <label title="目標正確率を達成する為のライフがstatusに表示されます。タイピングワードを逃す程ライフが減り、1ミスすると-1点されます。ライフがマイナスになると、目標正確率は達成不可能になりゲームオーバーになります。">
            <input type="radio" name="miss-limit-game-mode" value="life-correct-mode" checked>ライフ制</label>
          <span>
            <label style="height: 0;position:relative;bottom:2rem;">
              <input class="three-digits during-play-option" type="number" name="gameover-effect-volume" min="0" max="100" value="70" style="display: none;">
            </label>
            <label title="ゲームオーバーすると効果音が鳴るようになります。">
              <input class="during-play-option" type="checkbox" name="gameover-sound-effect" checked>ゲームオーバー音</label>
          </span>
        </div>
      </div>
      <div id="preparation-config">
        <h6>時間調整</h6>
        <div style="
    display: flex;
    align-items: baseline;
">
          <label class="mod-menu-round-wrapper default-pointer" title="プレイ中に変更できる時間調整の初期値を変更します。">全体時間調整
            <span class="btn btn-link cursor-pointer"  title="タイミングが遅くなります。SHIFTキーを押しながらクリックすると-0.1します。" id="initial-time-diff-minus">-</span>
            <span name="initial-time-diff" class="caret" contenteditable="true">0.00</span>
            <span class="btn btn-link cursor-pointer" title="タイミングが早くなります。SHIFTキーを押しながらクリックすると+0.1します。" id="initial-time-diff-plus">+</span>
          </label>
          <button type="button" id="initial-time-diff-reset" class="btn btn-light mx-3 mb-3">時間調整をリセット</button>
        </div>
      </div>
      <div id="font-size-config">
        <h6>フォント設定</h6>
        <div style="display:flex;width: fit-content;flex-direction: column;">
          <div style="display:flex;">
          <label class="mod-menu-round-wrapper default-pointer" style="margin:0;width:280px;">
            <span id="kana-main-font-size" style="display:none;">かな表示フォントサイズ</span>
            <span id="roma-main-font-size" style="display:none;margin-right: 0.5px;">ローマ字フォントサイズ</span>
            <span>
              <span class="btn btn-link cursor-pointer" id="kana-font-size-minus">-</span>
              <span name="kana-font-size-px" class="caret" contenteditable="true">21.0</span>px
              <span class="btn btn-link cursor-pointer" id="kana-font-size-plus">+</span>
            </span>
          </label>
          <label class="mod-menu-round-wrapper default-pointer" style="margin:0;width:280px;">
            <span id="kana-sub-font-size" style="display:none;">かな表示フォントサイズ</span>
            <span id="roma-sub-font-size" style="display:none;margin-right: 0.5px;">ローマ字フォントサイズ</span>
            <span>
              <span class="btn btn-link cursor-pointer" id="roma-font-size-minus">-</span>
              <span name="roma-font-size-px" class="caret" contenteditable="true">17.0</span>px
              <span class="btn btn-link cursor-pointer" id="roma-font-size-plus">+</span>
            </span>
          </label>
          </div>
          <div style="display:flex;margin-top:1rem;">
          <label class="mod-menu-round-wrapper default-pointer" style="margin:0;width:280px;">
            <span id="kana-main-font-spacing" style="display:none;margin-right: 35.5px;">かな表示 文字間隔</span>
            <span id="roma-main-font-spacing" style="display:none;margin-right: 35.5px;">ローマ字 文字間隔</span>
            <span>
              <span class="btn btn-link cursor-pointer" id="kana-font-spacing-minus">-</span>
              <span name="kana-font-spacing-px" class="caret" contenteditable="true">0.7</span>px
              <span class="btn btn-link cursor-pointer" id="kana-font-spacing-plus">+</span>
            </span>
          </label>
          <label class="mod-menu-round-wrapper default-pointer" style="margin:0;width:280px;">
            <span id="kana-sub-font-spacing" style="display:none;margin-right: 35.5px;">かな表示 文字間隔</span>
            <span id="roma-sub-font-spacing" style="display:none;margin-right: 35.5px;">ローマ字 文字間隔</span>
            <span>
              <span class="btn btn-link cursor-pointer" id="roma-font-spacing-minus">-</span>
              <span name="roma-font-spacing-px" class="caret" contenteditable="true">0.7</span>px
              <span class="btn btn-link cursor-pointer" id="roma-font-spacing-plus">+</span>
            </span>
          </label>
          </div>
          <div style="display:flex;margin-top:1rem;align-items: flex-end;">
          <label class="mod-menu-round-wrapper default-pointer" style="margin:0;width:280px;">
            <span id="font-shadow" style="margin-right: 51.5px;">テキスト縁取り</span>
            <span>
              <span class="btn btn-link cursor-pointer" id="font-shadow-minus">-</span>
              <span name="font-shadow-px" class="caret" contenteditable="true">0.6</span>px
              <span class="btn btn-link cursor-pointer" id="font-shadow-plus">+</span>
            </span>
          </label>
          <label title="">
          <input class="during-play-option" type="checkbox" name="bordering-word">入力前の文字のみ縁取り</label>
          </div>
        </div>
        <button style="margin:10px;width:97%;" class="btn btn-light" type="button" id="font-size-reset">フォント設定をリセット</button>
      </div>
      <div id="sound-config">
        <h6>効果音・音量</h6>
        <span style="display:flex;">
          <span class="sound-effect-list">
            <label title="正解打鍵をした時に効果音がなるようになります。">
              <input class="three-digits during-play-option" type="checkbox" name="typing-sound-effect">打鍵音</label>
            <label class="sound-effect-volume">
              <input class="three-digits during-play-option" type="number" name="typing-effect-volume" min="0" max="100" value="70">
            </label>
          </span>
          <span class="sound-effect-list" style="display:flex;">
            <label title="ミス打鍵をした時に効果音がなるようになります。">
              <input class="three-digits during-play-option" type="checkbox" name="miss-sound-effect">ミス音</label>
            <label title="行頭のミス打鍵時もミス音を鳴らします" id="miss-sound-effect-beginning-line" style="display:none;">
              <input class="during-play-option" type="checkbox" name="miss-beginning-sound-effect">行頭のミス音</label>
            <label class="sound-effect-volume">
              <input class="three-digits during-play-option" type="number" name="miss-effect-volume" min="0" max="100" value="70">
            </label>
          </span>
        </span>
        <span style="display:flex;">
          <span class="sound-effect-list">
            <label title="ライン中のタイピングワードをすべて入力した時に効果音がなるようになります。">
              <input class="three-digits during-play-option" type="checkbox" name="clear-sound-effect">クリア音</label>
            <label class="sound-effect-volume" style="margin-left: -3px;">
              <input class="three-digits during-play-option" type="number" name="line-clear-effect-volume" min="0" max="100" value="70">
            </label>
          </span>
          <span class="sound-effect-list">
            <label title="100コンボ以上コンボが続いている時にミスをすると、効果音が鳴るようになります">
              <input class="three-digits during-play-option" type="checkbox" name="combo-break-sound">100コンボ以上のミス音</label>
            <label class="sound-effect-volume">
              <input class="three-digits during-play-option" type="number" name="combo-break-effect-volume" min="0" max="100" value="70">
            </label>
          </span>
        </span>
        <label title="動画音量に合わせて効果音音量も変更されます。無効にすると効果音毎に個別で音量の指定ができます。">
          <input class="during-play-option" type="checkbox" name="sound-effect-interlocking-youtube-volume" checked>動画音量と効果音音量を連動</label>
      </div>
    </div>
  </div>
  <div class="mod-tab-content" id="design-content">
    <div class="mod-tab-content-description rgba-color-scroll-padding" style="padding-top:20px;">
      <div id="input-config">
        <h6>タイピングワード表示</h6>
        <label title="タイピングワードが一行に収まるように表示され、指定の文字数入力するとワードがスクロールされていきます。">
          <input class="during-play-option" type="checkbox" name="character-scroll">タイピングワードをスクロール表示
          <button type="button" style="margin: 0 0px 0px 15px!important;display: none;" id="character-scroll-length-reset" class="btn btn-light m-3">スクロール数をリセット</button>
        </label>
        <div id="character-scroll-config" style="display:none;">${FOLDED_RULED_LINE}
          <label class="mod-menu-round-wrapper default-pointer">かな表示スクロール数
            <span>
              <span class="btn btn-link cursor-pointer" id="kana-scroll-length-minus">-</span>
              <span name="kana-scroll-length" class="caret during-play-option" contenteditable="true">${PHONE_FLAG?"10":"5"}</span>
              <span class="btn btn-link cursor-pointer " id="kana-scroll-length-plus">+</span>
            </span>
          </label>
          <label class="mod-menu-round-wrapper default-pointer">ローマ字表示スクロール数
            <span>
              <span class="btn btn-link cursor-pointer" id="roma-scroll-length-minus">-</span>
              <span name="roma-scroll-length" class="caret during-play-option" contenteditable="true">${!PHONE_FLAG?"16":"8"}</span>
              <span class="btn btn-link cursor-pointer" id="roma-scroll-length-plus">+</span>
            </span>
          </label>
        </div>
        <label title="2文字以上連続で続く英単語・数字・記号をスペースひらがな区切りでハイライトします。">
          <input class="during-play-option" type="checkbox" name="character-word-highlight">英単語・数字記号毎にハイライト表示(ひらがな表示のみ対応)</label>
      </div>
      <div id="effect-config">
        <h6>エフェクト設定</h6>
        <div style="display:flex;">
          <label title="ミスをした文字の上に「・」マークが表示されます。">
            <input class="during-play-option" type="checkbox" name="miss-mark-effect" checked>ミスエフェクト</label>
          <label>
            <input class="color during-play-option" value="#FF3554" name="miss-effect-color">色で表示</label>
        </div>
        <div style="display:flex;">
          <label title="３・２・１・GO!のカウントダウンが表示されます。間奏中に歌詞がある場合は表示されません。">
            <input class="during-play-option" type="checkbox" name="countdown-effect" checked>カウントダウン</label>
          <label>
            <input class="color during-play-option" value="rgba(255,255,255,0.9)" name="countdown-effect-color">色で表示</label>
        </div>
        <div style="display:flex;">
          <label title="スキップ可能な時に「Type ~ key to skip. ⏩」と表示されるようになります。表示されているときにスペースキー又はEnterキーを押すとライン切り替わり1秒前にスキップします。">
            <input class="during-play-option" type="checkbox" name="skip-guide-effect" checked>
            <span style="margin:0 6.5px;">任意スキップ</span>
          </label>
          <label>
            <input class="color during-play-option" value="rgba(255,255,255,0.53)" name="skip-guide-effect-color">色で表示</label>
          <select class="during-play-option" name="skip-guide-key" title="スキップ機能で使用するキーを設定できます。" style="margin-left: 10px;position: relative;bottom: 3px;">
            <option value="skip-guide-space-key" selected>スペースキー</option>
            <option value="skip-guide-enter-key">Enterキー</option>
          </select>
        </div>
        <div style="display:flex;">
          <label title="タイピングエリアの左上に現在コンボを表示します。">
            <input class="during-play-option" type="checkbox" name="combo-counter-effect" checked>
            <span style="margin: 0 12.5px;">コンボ表示</span>
          </label>
          <label>
            <input class="color during-play-option" value="#FFFFFF" name="combo-counter-effect-color">色で表示</label>
        </div>
        <div id="line-clear-gauge-effect-option" style="display:flex;justify-content: flex-start;flex-direction: column;">
          <label title="動画下にラインクリア率ゲージを表示します。達成したクリア率に応じた色のトロフィーも表示されます。">
            <input class="during-play-option" type="checkbox" name="line-clear-gauge-effect">ラインクリア率ゲージ</label>
          <button style="margin:10px;" class="btn btn-light" type="button" id="effect-color-reset">エフェクト色をリセット</button>
        </div>
      </div>
      <div id="lyric-font-color-config">
        <h6>歌詞の色/表示</h6>
        <div style="display:flex;">
          <label>
            <span style="margin: 0 13px;">入力後</span>
            <input class="color during-play-option" value="#0099CC" name="correct-word-color">
          </label>
          <label>ラインクリア
            <input class="color during-play-option" value="#1eff52" name="line-clear-color">
          </label>
        </div>
        <div style="display:flex;">
          <label>先頭の文字
            <input class="color during-play-option" value="#FFFFFF" name="next-character-color">
          </label>
          <label>
            <span style="margin: 0 19.5px;">未入力</span>
            <input class="color during-play-option" value="#FFFFFF" name="word-color">
          </label>
        </div>
        <div style="display:flex;">
          <label>
            <span style="margin: 0 19.5px;">歌詞</span>
            <input class="color" value="#FFFFFF" name="lyric-color">
          </label>
          <label style="margin-right: -10px;">
            <span style="margin: 0 12.5px;">次の歌詞</span>
            <input class="color during-play-option" value="rgba(255,255,255,.7)" name="next-lyric-color">
          </label>
        </div>
        <div style="display:flex;">
          <label style="cursor:default;">
            <span style="margin:0 0.8px;">次の歌詞：</span>
            <select class="during-play-option" style="width:156px;" name="next-lyric-display-option" title="次の歌詞に表示する内容を設定できます。">
              <option value="next-text-lyric" selected>歌詞</option>
              <option value="next-text-kana">よみ</option>
            </select>
          </label>
          <label style="cursor:default;">
            <span style="cursor:default;margin: 0 8px;">自動変更：</span>
            <select style="width: 156px;margin-left:-6px;" name="color-preset">
              <option value="プリセット">プリセットから色変更</option>
              <option value="デフォルト">デフォルト</option>
              <option value="先頭の文字を赤く強調">先頭の文字を赤く強調</option>
              <option value="打つと消える">打つと消える</option>
              <option value="入力スタイル">入力スタイル</option>
            </select>
          </label>
        </div>
      </div>
    </div>
  </div>
  <div class="mod-tab-content" id="playarea-color-content">
    <div class="mod-tab-content-description rgba-color-scroll-padding">
      <p class="c-txtsp"></p>
      <div id="playarea-color-config">
        <h6>背景カラー</h6>
        <label style="width: fit-content;">タイピングエリア
          <input class="color" value="transparent" name="playarea-color" id="input2">
        </label>
        <button type="button" style="width: 97%;" id="playarea-color-reset" class="btn btn-light m-3">背景カラーをリセット</button>
      </div>
      <div id="line-color-config">
        <h6>ラインカラー</h6>
        <div style="display:flex;">
          <label>
            <span style="margin: 0 4px;">ラインゲージ</span>
            <input class="color" value="#17a2b8" name="phrase-line-color">
          </label>
          <label>
            <span style="margin: 0 4px;">empty</span>
            <input class="color" value="#f5f5f5" name="phrase-line-empty-color">
          </label>
        </div>
        <div style="display:flex;">
          <label>ラインゲージ2
            <input class="color" value="#ffc107" name="movie-line-color">
          </label>
          <label>empty2
            <input class="color" value="#f5f5f5" name="movie-line-empty-color">
          </label>
        </div>
        <button type="button" style="width: 97%;" id="line-color-reset" class="btn btn-light m-3">ラインカラーをリセット</button>
      </div>
      <div id="etc-color-config">
        <h6>その他の文字色</h6>
        <div style="display:flex;flex-direction: column;width: fit-content;">
          <label>
            <span style="margin: 0 7px;">ステータスエリア</span>
            <input class="color" value="#FFFFFF" name="status-area-color">
          </label>
        </div>
        <button type="button" style="width: 97%;" id="status-area-color-reset" class="btn btn-light m-3">ステータスエリア色をリセット</button>
      </div>
    </div>
  </div>
  <div class="mod-tab-content" id="etc-content">
    <div class="mod-tab-content-description">
      <p class="c-txtsp"></p>
      <div id="play-scroll-config">
        <h6>自動スクロール設定</h6>
        <label title="プレイ開始時やプレイ中の拡大値を変更したとき、自動でプレイエリアにスクロール位置が調整されます。プレイ開始時は画面内に動画が表示されていないと発動されません。">
          <input class="during-play-option" type="checkbox" name="play-scroll">プレイ開始時にスクロール位置を調整</label>
        <div id="adjust-config" style="display:flex;align-items:center;">${FOLDED_RULED_LINE}
          <select style="margin: 0 13px;position: relative;bottom: 5px;" name="scroll-adjustment" class="during-play-option">
            <option value="55" selected>中央</option>
            <option value="75">上揃え</option>
            <option value="-10">下揃え</option>
          </select>
        </div>
      </div>
      <div id="status-config">
        <h6>status表示設定</h6>
        <div id="status-mode" style="display:flex;">
          <label title="歌詞タイピングエリアを左側、status/rankingエリアを右側に表示します。歌詞タイピングエリアは狭くなりますが動画全体も表示しやすくなります。">
            <input class="during-play-option" type="radio" name="status-mode" value="status-mode-default" checked>折り返さない</label>
          <label title="歌詞タイピングエリアを上部全体で表示、status/rankingエリアを下部に表示します。動画が見切れやすくなりますが歌詞タイピングエリアが広くなりプレイしやすくなります。">
            <input type="radio" name="status-mode" value="status-mode-wrap">折り返す</label>
        </div>
        <input id="details" type="checkbox" name="details">
<details style="margin-left: 16px;">
  <summary>詳細設定</summary>
          <div style="display:flex;padding-top:7px;">
            <label>
              <input type="checkbox" name="visibility-score" checked>スコア</label>
            <label style="margin: 0 36px;">
              <input type="checkbox" name="visibility-miss" checked>ミス</label>
            <label style="margin: 0px -8px;">
              <input type="checkbox" name="visibility-escape-counter" checked>逃した文字数</label>
            <label style="margin: 0px 24px;">
              <input type="checkbox" name="visibility-typing-speed" checked>打鍵速度</label>
          </div>
          <div style="display:flex;">
            <label>
              <input type="checkbox" name="visibility-rank" checked>現在の順位</label>
            <label>
              <input type="checkbox" name="visibility-correct">正確率</label>
            <label>
              <input type="checkbox" name="visibility-type-counter" checked>正解打鍵</label>
            <label style="margin: 0 38px;">
              <input type="checkbox" name="visibility-remaining-line-counter" checked>残りライン</label>
          </div>
        </div>
</details>
      <div id="result-config">
        <h6>リザルト設定</h6>
        <div style="display:flex;">
          <label>
            <input type="radio" name="word-result" value="word-result" checked>ミスをした箇所を赤く表示</label>
          <label>
            <input name="word-result" type="radio" value="word-result-real">ミスをした文字を詳細に表示</label>
        </div>
      </div>

       <div id="shortcutkey-config">
        <h6>ショートカットキー設定</h6>
          <label><input class="during-play-option" type="checkbox" name="disable-left-right-shortcut">時間調整のショートカットキー(← →)を無効化</label>
	      <label><input class="during-play-option" type="checkbox" name="disable-up-down-shortcut">音量調整のショートカットキー(↑ ↓)を無効化</label>
		  <label><input class="during-play-option" type="checkbox" name="disable-change-mode">ローマ⇔かな入力切り替えショートカットキー(Alt+kana)を無効化</label>
       <div id="change-mode-config" style="display:flex;align-items:center;">${FOLDED_RULED_LINE}
          <label>かな入力モード選択時に切り替えるローマ字表示<select style="margin: 0 13px;" name="from-kana-mode-change">
            <option value="from-kana-display" selected>かな表示</option>
            <option value="from-roma-display">ローマ字表示</option>
          </select></label>
        </div>
      </div>
    </div>
  </div>
  <button type="button" id="setting-reset" style="position:absolute;right:10px;bottom:10px;background:#333;" class="btn btn-light">設定をリセット</button>`
	document.getElementsByClassName("share")[0].parentNode.insertBefore(MOD_SETTINGS_MENU , document.getElementsByClassName("share")[0].nextElementSibling);

	/**
     * @type {String} FOLDED_RULED_LINE - タイピングゲームの設定フォーム内で使用する折れ罫線。
     * @type {Array} DISABLE_SYMBOL_LIST - 記号省略設定有効時に省略される記号一覧の説明文。
     * @type {Array} VALID_SYMBOL_LIST - 記号省略設定有効時でも省略されない記号一覧の説明文。
     * @type {DOM} MOD_SETTINGS_MENU  - 動画上部の歯車アイコンをクリックすると表示されるタイピングゲームの設定フォーム。
     */
	//設定メニューの要素を変数に格納
	kanaModeConfig = document.getElementById("kana-mode-config")
	romaModeConfig = document.getElementById("roma-mode-config")

	document.getElementsByClassName("fa-cog")[0].addEventListener('mousedown', function createModMenuEvent(){
		LoadSoundEffect(true)
		mod_menu_event()
		OPTION_ACCESS_OBJECT['typing-effect-volume'] = document.getElementsByName('typing-effect-volume')[0]/100
		OPTION_ACCESS_OBJECT['miss-effect-volume'] = document.getElementsByName('miss-effect-volume')[0].value/100
		OPTION_ACCESS_OBJECT['line-clear-effect-volume'] = document.getElementsByName('line-clear-effect-volume')[0]/100
		OPTION_ACCESS_OBJECT['combo-break-effect-volume'] = document.getElementsByName('combo-break-effect-volume')[0].value/100
		OPTION_ACCESS_OBJECT['gameover-effect-volume'] = document.getElementsByName('gameover-effect-volume')[0].value/100
		document.getElementById("modal-overlay").addEventListener('click', function(){
			document.getElementById("modal-overlay").style.display = "none";
			document.getElementById("mod-menu").style.display = "none";
		});
		document.getElementsByClassName("fa-cog")[0].removeEventListener("mousedown",createModMenuEvent)
	});

	document.getElementsByClassName("fa-cog")[0].addEventListener('click', event => {
		centering();
		document.getElementById("modal-overlay").style.display = "block";
		//コンテンツをセンタリングする
		document.getElementById("mod-menu").style.display = "block";
		document.getElementById("mod-menu").animate([{opacity: '0'}, {opacity: '1'}], 100)
	});

	window.addEventListener('resize', centering);

	const LINE_CLEAR_GAUGE = document.createElement('div');
	LINE_CLEAR_GAUGE.setAttribute("id", "gauge");
	LINE_CLEAR_GAUGE.setAttribute("style", "display:none;");
	LINE_CLEAR_GAUGE.innerHTML = '<div class="progress2" id="gauge1" style="width: 80%;float: left;height:8px;"><div id="gauge-80-rate-less-than"></div></div><div class="progress2" id="gauge2" style="width: 20%;background: #4E3701;height:12px;"><span style="height: 5px;border-left: thin #FFEB3B solid;"></span><div id="gauge-80-rate-more-than"></div></div><div id="lineClearRate" style="font-weight: normal;color: #fff;text-align: right;width: 0px;float: right;position: relative;top: -26px;left: 3px;font-size: 1.4rem;font-family: sans-serif;">0%</div>'
	CONTROLBOX_SELECTOR.parentNode.insertBefore(LINE_CLEAR_GAUGE, CONTROLBOX_SELECTOR);
	lineClearRateSelector = document.getElementById("lineClearRate")
	lineClearGauge80RateLessThanSelector = document.getElementById("gauge-80-rate-less-than")
	lineClearGauge80RateMoreThanSelector = document.getElementById("gauge-80-rate-more-than")

	const START_METHOD = document.createElement('p');
	START_METHOD.setAttribute("id", "esckey");
	START_METHOD.setAttribute("style", `margin: 3px 0px 7px 0px; display:${PHONE_FLAG ? "none":"block"};`);
	START_METHOD.textContent = "Enterキー / 動画をクリックして開始"
	document.getElementById("playBotton1").parentNode.insertBefore(START_METHOD, document.getElementById("playBotton1"));

	createControlArea()

	createTypingModeOption()

	if(PHONE_FLAG){
		document.getElementById("line-clear-gauge-effect-option").style.display = "none"
		document.getElementById("play-scroll-config").style.display = "none"
		document.getElementById("status-mode").style.display = "none"
		document.querySelector("[value='kanamode_mac_type']").checked = true
	}
}());

function createControlArea(){
	document.getElementById("time_settings").style.visibility = "hidden"
	document.getElementById("time_settings").style.display = "flex"

	const SPEED_CHANGE_HTML = `<div id="speed_change">
  <span id="speed" class="control_option pointer">${play_speed.toFixed(2)}倍速</span>
  <kbd id="speed_change_F10" class="shortcut_navi cursor-pointer select_none">F10</kbd>
</div>`
	const TIME_ADJUST_HTML =
`<div id="time_adjust">
  <span class="control_option time_adjust_head">
    <span id="time_">時間調整</span>
    <span id="time_diff">0.00</span>
  </span>
  <kbd id="time_adjust_minus" class="shortcut_navi pointer select_none">←</kbd>
  <kbd id="time_adjust_plus" class="shortcut_navi pointer select_none">→</kbd>
</div>`

	const RESTART_HTML =
`<div id="song_reset">
  <span id="restart" class="control_option pointer">
    <span>やり直し</span>
  </span>
  <kbd id="song_reset_F4" class="shortcut_navi cursor-pointer select_none">F4</kbd>
</div>`

	const SHORTCUTKEY_LIST_HTML =
`<div id="more_shortcutkey" class="control_option pointer">
  <span>ショートカットキー</span>
  <div id="shortcut" class="short_popup">
    <div>
      <div>
        <span class="control-option2" style="background: #1ABC9C;">一時停止・再開</span>
        <kbd class="shortcut-navi-display-block">Esc</kbd>
      </div>
      <div>
        <span class="control-option2" style="
    background: #F5AB35;
">練習モードへ移行</span>
        <kbd class="shortcut-navi-display-block">F7</kbd>
      </div>
      <div>
        <span class="control-option2" style="
    background: #9b59b6;
">自動スキップON/OFF</span>
        <kbd class="shortcut-navi-display-block">Shift+↑↓</kbd>
      </div>
    </div>
    <div style="
    display: flex;
">
      <div>
        <span class="control-option2" style="
    background: #e67e22;
">入力モード切り替え</span>
        <kbd class="shortcut-navi-display-block">Alt+kana</kbd>
      </div>
      <div style="display:${PHONE_FLAG ? " none ":"block "};">
        <span class="control-option2" style="
    background: #22A7F0;
">音量調整 ±10</span>
        <kbd class="shortcut-navi-display-block">↑↓</kbd>
      </div>
      <div>
        <span class="control-option2" style="
    background: #2980b9;
">0.01ずつ時間調整</span>
        <kbd class="shortcut-navi-display-block">Ctrl+Shift+←→</kbd>
      </div>
    </div>
  </div>
</div>`

	//rankingタブにアンダーラインを追加。
	document.querySelector(".status .nav").children[1].classList.add('underline');

	if(PHONE_FLAG && document.documentElement.clientWidth < 650){
		const TIME_SETTING_CLONE = document.getElementById("time_settings").cloneNode(true)
		TIME_SETTING_CLONE.id = "time_settings2"
		document.getElementById("time_settings").style.marginBottom = "7px"
		document.getElementById("time_settings").parentNode.insertBefore(TIME_SETTING_CLONE, document.getElementById("time_settings").nextSibling);
		document.getElementById("time_settings2").innerHTML = `${TIME_ADJUST_HTML} ${SHORTCUTKEY_LIST_HTML}`

		document.getElementById("time_settings").innerHTML= `${SPEED_CHANGE_HTML} ${RESTART_HTML}`


	}else{
		document.getElementById("time_settings").innerHTML= `${SPEED_CHANGE_HTML} ${TIME_ADJUST_HTML} ${RESTART_HTML} ${SHORTCUTKEY_LIST_HTML}`
	}
}

function createTypingModeOption(){
	while(document.querySelectorAll("[id*='playBotton']").length != 0){
		document.querySelectorAll("[id*='playBotton']")[0].remove()
	}
document.getElementById("esckey").insertAdjacentHTML("afterend",`<form id="mode-select-area">
<style>
group + group {
	margin-top: 20px;
	font-weight:600;
  }
  .inline-radio {
	display: flex;
	overflow: hidden;
	border: 1.5px solid #ffffff;
	font-weight:600;
	border-radius: 0;
    margin-top: 12px;
  }
  .inline-radio div {
	position: relative;
	flex: 1;
    word-break: keep-all;
    text-align: center;
  }
  .inline-radio input {
	width: 100%;
	height: 60px;
	opacity: 0;
  }
  .inline-radio label {
	display: grid;
    justify-items: center;
    align-content: center;
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	align-items: center;
	justify-content: center;
	pointer-events: none;
	color:#fff;
	border-right: 1.5px solid #ffffff;
	border-radius: 0;
}
  .inline-radio div:last-child label {
	border-right: 0;
  }
  .inline-radio .roma:checked + label {
	background: #17a3b8d2!important;
	color: #fff;
  }
  .inline-radio .kana:checked + label {
	background: #de781fde!important;
	color: #fff;
  }
  .inline-radio .flick:checked + label {
	background: #59e04db6!important;
	color: #fff;
  }
  .inline-radio .roma:hover + label {
	background: #17a3b856;
	color: #fff;
  }
  .inline-radio .kana:hover + label {
	background: #de781f85;
	color: #fff;
  }
  .inline-radio .flick:hover + label {
	background: #59e04d3b;
	color: #fff;
  }
    ${!PHONE_FLAG ? `
  .inline-radio small{
  position:absolute;
  bottom: 5.5px;
  }` : ""}
</style>
${PHONE_FLAG ? `<group class="inline-radio"><div id="playBotton5"><input type="radio" name="mode_select" value="kanamode_mac_type" class="flick" id="flick-mode"><label>フリック入力<small style="font-weight: 600;">ここをタップして開始すると<wbr>キーボードが表示されます！</small></label></div></group>` : ""}
${PHONE_FLAG ? `<div style="margin-top: 15px;"><small>Bluetoothキーボード等を接続してプレイ</small></div>` : ''}
<group class="inline-radio" ${PHONE_FLAG ? 'style="margin-top:0;"' : ''}>
  <div id="playBotton1"><input type="radio" name="mode_select" value="kana_type" class="roma" checked><label><div>ローマ字<wbr>入力</div><small >かな表示</small></label></div>
  <div id="playBotton2"><input type="radio" name="mode_select" value="roma_type" class="roma"><label><div>ローマ字<wbr>入力</div><small>ローマ字表示</small></label></div>
  <div id="playBotton4"><input type="radio" name="mode_select" value="kanamode_type" class="kana"><label>かな<wbr>入力</label></div>
  ${!PHONE_FLAG ? `<div id="playBotton5"><input type="radio" name="mode_select" value="kanamode_mac_type" class="flick" id="flick-mode"><label>フリック<wbr>入力</label></div>` : ""}
</group>

<div class="sub-button">
<style>
.speed-option {
    color: #FFF;
    display: inline-flex;
    align-content: center;
    align-items: center;
    font-size: inherit;
    width:${PHONE_FLAG ? `100%` : "16rem"};
	${PHONE_FLAG ? `margin-bottom:15px` : ""};
    justify-content: center;
}
.sub-button{
  display: flex;
  justify-content: space-between;
  margin: ${PHONE_FLAG ? `1rem` : "3rem"} 0 1.5rem 0;
${PHONE_FLAG ? `flex-direction: column;` : ""}
}
span.btn-border {
	border: 1px solid #FFF;
  font-weight:600;
  border-radius: 0;
  width:${PHONE_FLAG ? `100%` : "16rem"};
  color: rgb(255, 255, 255);
  }

  span.btn-border:hover {
	background: rgba(245, 245, 245, 0.356);
  }
</style>
<span class="mod-menu-round-wrapper speed-option" style="transform: scale(1);" id="playBotton3">
<span>挑戦速度</span>
<button type="button" class="btn btn-link cursor-pointer" onclick="play_speed_down()" data-toggle="tooltip" data-placement="bottom" title="再生速度を遅くして挑戦">-</button>
<span id="playspeed">1.00倍速</span>
<button type="button" class="btn btn-link cursor-pointer" onclick="play_speed_up()" data-toggle="tooltip" data-placement="bottom" title="再生速度を早くして挑戦">+</button>
</span>
<div><span class="btn btn-border cursor-pointer" id="practice-mode-button" onclick="play_mode='practice';player.playVideo();">練習モードで開始</span></div>
</div>
</form>`)

	if(PHONE_FLAG){
		document.getElementById("flick-mode").addEventListener("click",create_flick_textbox)
		document.getElementById("flick-mode").addEventListener("click",mobile_sound_enables)
		document.getElementById("practice-mode-button").addEventListener("click",mobile_sound_enables)
	}
}



//MOD設定メニュー位置調整する関数
function centering(){
	//画面(ウィンドウ)の幅、高さを取得
	var w = document.body.clientWidth;
	//センタリングを実行する
	document.getElementById("mod-menu").style.width = (w >= 600 ? "580px" : "100%" );
}



let initialTimeDiff = 0.0 //ローカルストレージに保存された時間調整値

//MOD設定メニュー項目変更時に呼び出すイベント集
function mod_menu_event(){
	//設定リセット関数
	checkbox_effect_mod_open_play()

	document.getElementById("setting-reset").addEventListener('click', function (){
		let res = confirm("初期設定に戻します。よろしいですか？\n(設定の初期化完了後、ページのリロードを行います。)");
		if( res == true ) {
			const transaction = db.transaction([STORE_NAME], "readwrite");
			const store = transaction.objectStore(STORE_NAME);
			const request = store.clear();
			request.onsuccess = event => {
				location.reload()
			}
		}
	});


	document.getElementById("effect-color-reset").addEventListener('click', function (){
		document.getElementsByName('miss-effect-color')[0].value = "#FF3554"
		document.getElementsByName('miss-effect-color')[0].style.backgroundColor="rgb(255, 53, 84)"
		document.getElementsByName('miss-effect-color')[0].style.color="rgb(255, 255, 255)"

		document.getElementsByName('countdown-effect-color')[0].value = "rgba(255,255,255,0.9)"
		document.getElementsByName('countdown-effect-color')[0].style.backgroundColor="rgba(255,255,255,0.9)"
			document.getElementsByName('countdown-effect-color')[0].style.color="rgb(0, 0, 0)"

			document.getElementsByName('skip-guide-effect-color')[0].value = "rgba(255,255,255,0.53)"
			document.getElementsByName('skip-guide-effect-color')[0].style.backgroundColor="rgba(255,255,255,0.53)"
			document.getElementsByName('skip-guide-effect-color')[0].style.color="rgb(0, 0, 0)"

			document.getElementsByName('combo-counter-effect-color')[0].value = "#FFFFFF"
			document.getElementsByName('combo-counter-effect-color')[0].style.backgroundColor="rgb(255, 255, 255)"
			document.getElementsByName('combo-counter-effect-color')[0].style.color="rgb(0, 0, 0)"
			saveModOption()
	});


	document.getElementById("playarea-color-reset").addEventListener('click', function (){

			document.getElementsByName('playarea-color')[0].value = "transparent"
			document.getElementsByName('playarea-color')[0].style.backgroundColor="transparent"
			document.getElementsByName('playarea-color')[0].style.color="rgb(0, 0, 0)"
			saveModOption()
	});


	document.getElementById("line-color-reset").addEventListener('click', function (){
			document.getElementsByName('phrase-line-color')[0].value = "#17a2b8";
			document.getElementsByName('phrase-line-color')[0].style.backgroundColor="rgb(23, 162, 184)"
			document.getElementsByName('phrase-line-color')[0].style.color="rgb(255, 255, 255)"

			document.getElementsByName('movie-line-color')[0].value = "#ffc107"
			document.getElementsByName('movie-line-color')[0].style.backgroundColor="rgb(255, 193, 7)"
			document.getElementsByName('movie-line-color')[0].style.color="rgb(0, 0, 0)"

			document.getElementsByName('phrase-line-empty-color')[0].value = "#f5f5f5"
			document.getElementsByName('movie-line-empty-color')[0].value = "#f5f5f5"

			document.getElementsByName('phrase-line-empty-color')[0].style.backgroundColor="rgb(245, 245, 245)"
			document.getElementsByName('phrase-line-empty-color')[0].style.color="rgb(0, 0, 0)"

			document.getElementsByName('movie-line-empty-color')[0].style.backgroundColor="rgb(245, 245, 245)"
			document.getElementsByName('movie-line-empty-color')[0].style.color="rgb(0, 0, 0)"
			saveModOption()
	});

	document.getElementById("status-area-color-reset").addEventListener('click', function (){
			document.getElementsByName('status-area-color')[0].value = "#FFFFFF"
			document.getElementsByName('status-area-color')[0].style.backgroundColor="rgb(255, 255, 255)"
			document.getElementsByName('status-area-color')[0].style.color="rgb(0, 0, 0)"
			saveModOption()
	});



	const MODAL_OVERLAY= document.createElement('div');
	MODAL_OVERLAY.setAttribute("id", "modal-overlay");
	MODAL_OVERLAY.setAttribute("style", "display:none;");
	document.body.appendChild(MODAL_OVERLAY);


	// おすすめ設定追加
	const OSUSUME_MENU = document.createElement('div');
	OSUSUME_MENU.setAttribute("id", "mask");
	OSUSUME_MENU.setAttribute("class", "hidden");

	const SECTION = document.createElement('section');
	SECTION.setAttribute("id", "modal");
	SECTION.setAttribute("class", "hidden");
	SECTION.innerHTML = '<div class="cursor-pointer" id="osusume1" >動画・音楽重視</div><div class="cursor-pointer" id="osusume2" >タイピング重視</div>'
	document.getElementsByClassName("share")[0].parentNode.insertBefore(OSUSUME_MENU , document.getElementsByClassName("share")[0].nextElementSibling);
	document.getElementsByClassName("share")[0].parentNode.insertBefore(SECTION , document.getElementsByClassName("share")[0].nextElementSibling);

	document.getElementById('osusume').addEventListener('click' , event => {
		document.getElementById('modal').classList.remove('hidden');
		document.getElementById('mask').classList.remove('hidden');
	})

	document.getElementById('mask').addEventListener('click' , event => {
		document.getElementById('modal').classList.add('hidden');
		document.getElementById('mask').classList.add('hidden');
	})

	document.getElementById('osusume1').addEventListener('click' , event => {
		document.getElementById('modal').classList.add('hidden');
		document.getElementById('mask').classList.add('hidden');
		document.querySelector("[value=status-mode-default]").checked = true;
		document.getElementsByName('visibility-correct')[0].checked = false;
		document.getElementsByName('visibility-remaining-line-counter')[0].checked = true;
		document.getElementsByName('visibility-rank')[0].checked = true;
		document.getElementsByName('visibility-typing-speed')[0].checked = true;
		document.getElementsByName('visibility-escape-counter')[0].checked = true;
		document.getElementsByName('miss-mark-effect')[0].checked = true;
		document.getElementsByName('gameover-sound-effect')[0].checked = true;
		document.getElementsByName('countdown-effect')[0].checked = true;
		document.getElementsByName('sub')[0].checked = true;
		document.getElementsByName('sound-effect-interlocking-youtube-volume')[0].checked = true;
		document.getElementsByName('skip-guide-effect')[0].checked = true;
		document.getElementsByName('visibility-score')[0].checked = true;
		document.getElementsByName('visibility-miss')[0].checked = true;
		document.getElementsByName('visibility-type-counter')[0].checked = true;
		document.getElementsByName('combo-counter-effect')[0].checked = true;
		document.getElementsByName('line-clear-gauge-effect')[0].checked = false;
		document.getElementsByName('case-sensitive-mode')[0].checked = false;
		document.getElementsByName('miss-limit-mode')[0].checked = false;
		document.getElementsByName('character-scroll')[0].checked = false;
		document.getElementsByName('typing-sound-effect')[0].checked = false;
		document.getElementsByName('miss-sound-effect')[0].checked = false;
		document.getElementsByName('miss-beginning-sound-effect')[0].checked = false;
		document.getElementsByName('clear-sound-effect')[0].checked = false;
		document.getElementsByName('combo-break-sound')[0].checked = false;
		document.getElementsByName('character-word-highlight')[0].checked = false;


		if(document.getElementsByName('playarea-color')[0].value === "rgba(0,0,0,0.5)"){
			document.getElementsByName('playarea-color')[0].value = "transparent"
			document.getElementsByName('playarea-color')[0].style.backgroundColor='transparent';
			document.getElementsByName('playarea-color')[0].style.color='rgb(0, 0, 0)';
		}
		if(document.getElementsByName('phrase-line-empty-color')[0].value === "#555555"){
			document.getElementsByName('phrase-line-empty-color')[0].value = "#f5f5f5"
			document.getElementsByName('phrase-line-empty-color')[0].style.backgroundColor="rgb(245, 245, 245)"
			document.getElementsByName('phrase-line-empty-color')[0].style.color="rgb(0, 0, 0)"
		}

		if(document.getElementsByName('movie-line-empty-color')[0].value === "#555555"){
			document.getElementsByName('movie-line-empty-color')[0].value = "#f5f5f5"
			document.getElementsByName('movie-line-empty-color')[0].style.backgroundColor="rgb(245, 245, 245)"
			document.getElementsByName('movie-line-empty-color')[0].style.color="rgb(0, 0, 0)"
		}
		saveModOption()
	})

	document.getElementById('osusume2').addEventListener('click' , event => {
		document.getElementById('modal').classList.add('hidden');
		document.getElementById('mask').classList.add('hidden');
		document.querySelector("[value=next-text-lyric]").selected = true;
		document.getElementsByName('typing-sound-effect')[0].checked = true;
		document.getElementsByName('miss-sound-effect')[0].checked = true;
		document.getElementsByName('miss-beginning-sound-effect')[0].checked = false;
		document.getElementsByName('clear-sound-effect')[0].checked = true;
		document.getElementsByName('combo-break-sound')[0].checked = true;
		document.getElementsByName('visibility-remaining-line-counter')[0].checked = true;
		document.getElementsByName('visibility-rank')[0].checked = true;
		document.getElementsByName('visibility-typing-speed')[0].checked = true;
		document.getElementsByName('visibility-escape-counter')[0].checked = true;
		document.getElementsByName('miss-mark-effect')[0].checked = true;
		document.getElementsByName('gameover-sound-effect')[0].checked = true;
		document.getElementsByName('countdown-effect')[0].checked = true;
		document.getElementsByName('sub')[0].checked = true;
		document.getElementsByName('visibility-correct')[0].checked = true;
		document.getElementsByName('sound-effect-interlocking-youtube-volume')[0].checked = true;
		document.getElementsByName('skip-guide-effect')[0].checked = true;
		document.getElementsByName('visibility-score')[0].checked = true;
		document.getElementsByName('visibility-miss')[0].checked = true;
		document.getElementsByName('visibility-type-counter')[0].checked = true;
		document.getElementsByName('combo-counter-effect')[0].checked = true;
		document.querySelector("[value=status-mode-wrap]").checked = true;

		document.getElementsByName('case-sensitive-mode')[0].checked = false;
		document.getElementsByName('miss-limit-mode')[0].checked = false;
		document.getElementsByName('character-scroll')[0].checked = false;
		document.getElementsByName('character-word-highlight')[0].checked = false;


		if(document.getElementsByName('playarea-color')[0].value === "transparent"){
			document.getElementsByName('playarea-color')[0].value = "rgba(0,0,0,0.5)";
			document.getElementsByName('playarea-color')[0].style.backgroundColor = 'rgba(0,0,0,0.5)';
			document.getElementsByName('playarea-color')[0].style.color = 'rgb(0, 0, 0)';
		}

		if(document.getElementsByName('phrase-line-empty-color')[0].value === "#f5f5f5"){
			document.getElementsByName('phrase-line-empty-color')[0].value = "#555555"
			document.getElementsByName('phrase-line-empty-color')[0].style.backgroundColor = "rgb(85, 85, 85)"
			document.getElementsByName('phrase-line-empty-color')[0].style.color = "rgb(255, 255, 255)"
		}

		if(document.getElementsByName('movie-line-empty-color')[0].value === "#f5f5f5"){
			document.getElementsByName('movie-line-empty-color')[0].value = "#555555"
			document.getElementsByName('movie-line-empty-color')[0].style.backgroundColor = "rgb(85, 85, 85)"
			document.getElementsByName('movie-line-empty-color')[0].style.color = "rgb(255, 255, 255)"
		}

		saveModOption()
	})


	document.getElementById("mod-menu").addEventListener('change', saveModOption);

	let type_sound_selector = document.getElementsByName('typing-sound-effect')[0]
	let miss_sound_selector = document.getElementsByName('miss-sound-effect')[0]
	let clear_sound_selector = document.getElementsByName('clear-sound-effect')[0]
	let combo_break_sound_selector = document.getElementsByName('combo-break-sound')[0]
	let gameover_sound_selector = document.getElementsByName('gameover-sound-effect')[0]

	type_sound_selector.addEventListener('change', function(){
		if(type_sound_selector.checked){
			key_type_play()
		}
	});
	miss_sound_selector.addEventListener('change', function(){
		if(miss_sound_selector.checked){
			miss_type_play()
			document.getElementById("miss-sound-effect-beginning-line").style.display = "";
		}else{
			document.getElementById("miss-sound-effect-beginning-line").style.display = "none";
		}
	});
	clear_sound_selector.addEventListener('change', function(){if(clear_sound_selector.checked){clear_type_play()}});
	combo_break_sound_selector.addEventListener('change', function(){if(combo_break_sound_selector.checked){combo_break_play()}});
	gameover_sound_selector.addEventListener('change', function(){if(gameover_sound_selector.checked){gameover_sound_play()}});
	document.querySelector("[value=status-mode-default]").addEventListener('change',scroll_change)
	document.querySelector("[value=status-mode-wrap]").addEventListener('change',scroll_change)
	document.getElementsByName('scroll-adjustment')[0].addEventListener('change',scroll_change)
	document.querySelector("[value=status-mode-wrap]").addEventListener("change",event => {
		if(event.target.checked){
			document.getElementsByName('visibility-correct')[0].checked = true
			putOptionSaveData('visibility-correct' , true)
		}
	})
	document.querySelector("[value=status-mode-default]").addEventListener("change",event => {
		if(event.target.checked){
			document.getElementsByName('visibility-correct')[0].checked = false
			putOptionSaveData('visibility-correct' , false)
		}
	})
	document.getElementById("initial-time-diff-reset").addEventListener('click', function (){
		initialTimeDiff=0
		document.getElementsByName('initial-time-diff')[0].textContent = initialTimeDiff.toFixed(2);
		putOptionSaveData('initial-time-diff' , initialTimeDiff.toFixed(2))
	});


	document.getElementById("initial-time-diff-minus").addEventListener('click', function (){
		initialTimeDiff = Number(document.getElementsByName('initial-time-diff')[0].textContent)

		if(initialTimeDiff > -4){
			initialTimeDiff = !event.shiftKey ? Number((initialTimeDiff-0.01).toFixed(2)) : Number((initialTimeDiff-0.1).toFixed(2))
		}
		if(initialTimeDiff <= -4){
			initialTimeDiff = -4
		}

		const initialTimeDiffToFixed2 = initialTimeDiff.toFixed(2)
		document.getElementsByName('initial-time-diff')[0].textContent = initialTimeDiffToFixed2;
		document.getElementById("time_diff").textContent = initialTimeDiffToFixed2;

		putOptionSaveData('initial-time-diff' , initialTimeDiffToFixed2)
		player.difftime = Number(initialTimeDiffToFixed2)
	});

	document.getElementById("initial-time-diff-plus").addEventListener('click', function (){
		initialTimeDiff =  Number(document.getElementsByName('initial-time-diff')[0].textContent)

		if(initialTimeDiff < 4){
			initialTimeDiff = !event.shiftKey ? Number((initialTimeDiff+0.01).toFixed(2)) : Number((initialTimeDiff+0.1).toFixed(2))
		}
		if(initialTimeDiff >= 4){
			initialTimeDiff = 4
		}

		const initialTimeDiffToFixed2 = initialTimeDiff.toFixed(2);
		document.getElementsByName('initial-time-diff')[0].textContent = initialTimeDiffToFixed2;
		document.getElementById("time_diff").textContent = initialTimeDiffToFixed2;
		putOptionSaveData('initial-time-diff' , initialTimeDiffToFixed2)
		player.difftime = initialTimeDiff

	});

	document.getElementById("kana-scroll-length-minus").addEventListener('click', function (){
		scroll_kana = Number(document.getElementsByName('kana-scroll-length')[0].textContent)

		if(scroll_kana > 0){
			scroll_kana = Number((scroll_kana-1).toFixed())
		}

		document.getElementsByName('kana-scroll-length')[0].textContent = scroll_kana
		OPTION_ACCESS_OBJECT['kana-scroll-length'] = scroll_kana
		putOptionSaveData('kana-scroll-length' , scroll_kana)
	});
	document.getElementById("kana-scroll-length-plus").addEventListener('click', function (){
		scroll_kana = Number(document.getElementsByName('kana-scroll-length')[0].textContent)

		if(scroll_kana < 30){
			scroll_kana = Number((scroll_kana+1).toFixed())
		}
		if(scroll_kana > 30){
			scroll_kana = 30
		}

		document.getElementsByName('kana-scroll-length')[0].textContent = scroll_kana
		OPTION_ACCESS_OBJECT['kana-scroll-length'] = scroll_kana
		putOptionSaveData('kana-scroll-length' , scroll_kana)
	});
	document.getElementsByName('kana-scroll-length')[0].addEventListener('focusout', function (event){
		scroll_kana = +Number(event.target.textContent).toFixed()
		if(isNaN(scroll_kana)){
			scroll_kana = (!PHONE_FLAG?10:5)
		}
		if(scroll_kana > 30){
			scroll_kana = 30
		}
		if(scroll_kana < 0){
			scroll_kana = 0
		}

		document.getElementsByName('kana-scroll-length')[0].textContent = scroll_kana
		OPTION_ACCESS_OBJECT['kana-scroll-length'] = scroll_kana
		putOptionSaveData('kana-scroll-length' , scroll_kana)
	});
	document.getElementById("roma-scroll-length-minus").addEventListener('click', function (){
		scroll_roma = Number(document.getElementsByName('roma-scroll-length')[0].textContent)

		if(scroll_roma > 0){
			scroll_roma = Number((scroll_roma-1).toFixed())
		}

		document.getElementsByName('roma-scroll-length')[0].textContent = scroll_roma
		OPTION_ACCESS_OBJECT['roma-scroll-length'] = scroll_roma
		putOptionSaveData('roma-scroll-length' , scroll_roma)
	});
	document.getElementById("roma-scroll-length-plus").addEventListener('click', function (){
		scroll_roma = Number(document.getElementsByName('roma-scroll-length')[0].textContent)

		if(scroll_roma < 30){
			scroll_roma = Number((scroll_roma+1).toFixed())
		}
		if(scroll_roma > 30){
			scroll_roma = 30
		}

		document.getElementsByName('roma-scroll-length')[0].textContent = scroll_roma
		OPTION_ACCESS_OBJECT['roma-scroll-length'] = scroll_roma
		putOptionSaveData('roma-scroll-length' , scroll_roma)
	});
	document.getElementsByName('roma-scroll-length')[0].addEventListener('focusout', function (event){
		scroll_roma = +Number(event.target.textContent).toFixed()
		if(isNaN(scroll_roma)){
			scroll_roma = (!PHONE_FLAG?16:8)
		}
		if(scroll_roma > 30){
			scroll_roma = 30
		}
		if(scroll_roma < 0){
			scroll_roma = 0
		}

		document.getElementsByName('roma-scroll-length')[0].textContent = scroll_roma
		OPTION_ACCESS_OBJECT['roma-scroll-length'] = scroll_roma
		putOptionSaveData('roma-scroll-length' , scroll_roma)
	});
	document.getElementById("character-scroll-length-reset").addEventListener('click', function (event){
		document.getElementsByName('kana-scroll-length')[0].textContent = (!PHONE_FLAG?10:5)
		OPTION_ACCESS_OBJECT['kana-scroll-length'] = (!PHONE_FLAG?10:5)
		putOptionSaveData('kana-scroll-length' , (!PHONE_FLAG?10:5))
		document.getElementsByName('roma-scroll-length')[0].textContent = (!PHONE_FLAG?16:8)
		OPTION_ACCESS_OBJECT['roma-scroll-length'] = (!PHONE_FLAG?16:8)
		putOptionSaveData('roma-scroll-length' , (!PHONE_FLAG?16:8))
	});


	document.getElementById("kana-font-size-plus").addEventListener('click', function (){
		font_kana = +document.getElementsByName('kana-font-size-px')[0].textContent

		if(font_kana < 25){
			font_kana = Number((font_kana+0.5).toFixed(1))
		}
		if(font_kana > 25){
			font_kana = 25
		}
		if(font_kana == 0.5){
			font_kana = 10
		}

		document.getElementsByName('kana-font-size-px')[0].textContent = font_kana.toFixed(1)
		putOptionSaveData('kana-font-size-px' , font_kana.toFixed(1))
		set_status_setting()
	});

	document.getElementById("kana-font-size-minus").addEventListener('click', function (){
		font_kana = +document.getElementsByName('kana-font-size-px')[0].textContent
		if(font_kana > 0){
			font_kana = Number((font_kana-0.5).toFixed(1))
		}
		if(font_kana < 10){
			font_kana = 0
		}

		document.getElementsByName('kana-font-size-px')[0].textContent = font_kana.toFixed(1)
		putOptionSaveData('kana-font-size-px' , font_kana.toFixed(1))
		set_status_setting()
	});
	document.getElementsByName('kana-font-size-px')[0].addEventListener('focusout', function (event){
		font_kana = +Number(event.target.textContent).toFixed(1)
		if(isNaN(font_kana)){
			font_kana = 21
		}
		if(font_kana > 25){
			font_kana = 25
		}
		if(font_kana < 10 && font_kana != 0){
			font_kana = 10
		}

		document.getElementsByName('kana-font-size-px')[0].textContent = font_kana.toFixed(1)
		putOptionSaveData('kana-font-size-px' , font_kana.toFixed(1))
		set_status_setting()
	});

	document.getElementById("roma-font-size-plus").addEventListener('click', function (){
		font_roma = +document.getElementsByName('roma-font-size-px')[0].textContent

		if(font_roma < 25){
			font_roma = Number((font_roma+0.5).toFixed(1))
		}
		if(font_roma > 25){
			font_roma = 25
		}
		if(font_roma == 0.5){
			font_roma = 10
		}
		document.getElementsByName('roma-font-size-px')[0].textContent = font_roma.toFixed(1)
		putOptionSaveData('roma-font-size-px' , font_roma.toFixed(1))
		set_status_setting()
	});

	document.getElementById("roma-font-size-minus").addEventListener('click', function (){
		font_roma = +document.getElementsByName('roma-font-size-px')[0].textContent
		if(font_roma > 0){
			font_roma = Number((font_roma-0.5).toFixed(1))
		}
		if(font_roma < 10){
			font_roma = 0
		}

		document.getElementsByName('roma-font-size-px')[0].textContent = font_roma.toFixed(1)
		putOptionSaveData('roma-font-size-px' , font_roma.toFixed(1))
		set_status_setting()
	});
	document.getElementsByName('roma-font-size-px')[0].addEventListener('focusout', function (event){
		font_roma = +Number(event.target.textContent)
		if(isNaN(font_roma)){
			font_roma = 17
		}
		if(font_roma > 25){
			font_roma = 25
		}
		if(font_roma < 10 && font_roma != 0){
			font_roma = 10
		}

		document.getElementsByName('roma-font-size-px')[0].textContent = font_roma.toFixed(1)
		putOptionSaveData('roma-font-size-px' , font_roma.toFixed(1))
		set_status_setting()
	});

//文字の間隔設定
	document.getElementById("kana-font-spacing-plus").addEventListener('click', function (){
		spacing_kana = +document.getElementsByName('kana-font-spacing-px')[0].textContent

		if(spacing_kana < 3){
			spacing_kana = Number((spacing_kana+0.1).toFixed(1))
		}
		if(spacing_kana > 3){
			spacing_kana = 3
		}
		if(spacing_kana <= 0){
			spacing_kana = 0
		}

		document.getElementsByName('kana-font-spacing-px')[0].textContent = spacing_kana.toFixed(1)
		putOptionSaveData('kana-font-spacing-px' , spacing_kana.toFixed(1))
		set_status_setting()
	});

	document.getElementById("kana-font-spacing-minus").addEventListener('click', function (){
		spacing_kana = +document.getElementsByName('kana-font-spacing-px')[0].textContent
		if(spacing_kana > 0){
			spacing_kana = Number((spacing_kana-0.1).toFixed(1))
		}
		if(spacing_kana <= 0){
			spacing_kana = 0
		}

		document.getElementsByName('kana-font-spacing-px')[0].textContent = spacing_kana.toFixed(1)
		putOptionSaveData('kana-font-spacing-px' , spacing_kana.toFixed(1))
		set_status_setting()
	});
	document.getElementsByName('kana-font-spacing-px')[0].addEventListener('focusout', function (event){
		spacing_kana = +Number(event.target.textContent).toFixed(1)
		if(isNaN(spacing_kana)){
			spacing_kana = 0.7
		}
		if(spacing_kana > 3){
			spacing_kana = 3
		}
		if(spacing_kana <= 0 ){
			spacing_kana = 0
		}

		document.getElementsByName('kana-font-spacing-px')[0].textContent = spacing_kana.toFixed(1)
		putOptionSaveData('kana-font-spacing-px' , spacing_kana.toFixed(1))
		set_status_setting()
	});

	document.getElementById("roma-font-spacing-plus").addEventListener('click', function (){
		spacing_roma = +document.getElementsByName('roma-font-spacing-px')[0].textContent

		if(spacing_roma < 3){
			spacing_roma = Number((spacing_roma+0.1).toFixed(1))
		}
		if(spacing_roma > 3){
			spacing_roma = 3
		}
		if(spacing_roma <= 0 ){
			spacing_roma = 0
		}
		document.getElementsByName('roma-font-spacing-px')[0].textContent = spacing_roma.toFixed(1)
		putOptionSaveData('roma-font-spacing-px' , spacing_roma.toFixed(1))
		set_status_setting()
	});

	document.getElementById("roma-font-spacing-minus").addEventListener('click', function (){
		spacing_roma = +document.getElementsByName('roma-font-spacing-px')[0].textContent
		if(spacing_roma > 0){
			spacing_roma = Number((spacing_roma-0.1).toFixed(1))
		}
		if(spacing_roma <= 0){
			spacing_roma = 0
		}

		document.getElementsByName('roma-font-spacing-px')[0].textContent = spacing_roma.toFixed(1)
		putOptionSaveData('roma-font-spacing-px' , spacing_roma.toFixed(1))
		set_status_setting()
	});
	document.getElementsByName('roma-font-spacing-px')[0].addEventListener('focusout', function (event){
		spacing_roma = +Number(event.target.textContent)
		if(isNaN(spacing_roma)){
			spacing_roma = 0.7
		}
		if(spacing_roma > 3){
			spacing_roma = 3
		}
		if(spacing_roma <= 0){
			spacing_roma = 0
		}

		document.getElementsByName('roma-font-spacing-px')[0].textContent = spacing_roma.toFixed(1)
		putOptionSaveData('roma-font-spacing-px' , spacing_roma.toFixed(1))
		set_status_setting()
	});


	document.getElementById("font-shadow-plus").addEventListener('click', function (){
		font_shadow = +document.getElementsByName('font-shadow-px')[0].textContent

		if(font_shadow < 3){
			font_shadow = Number((font_shadow+0.1).toFixed(1))
		}
		if(font_shadow > 3){
			font_shadow = 3
		}
		if(font_shadow <= 0 ){
			font_shadow = 0
		}
		document.getElementsByName('font-shadow-px')[0].textContent = font_shadow.toFixed(1)
		putOptionSaveData('font-shadow-px' , font_shadow.toFixed(1))
		set_status_setting()
	});

	document.getElementById("font-shadow-minus").addEventListener('click', function (){
		font_shadow = +document.getElementsByName('font-shadow-px')[0].textContent
		if(font_shadow > 0){
			font_shadow = Number((font_shadow-0.1).toFixed(1))
		}
		if(font_shadow <= 0){
			font_shadow = 0
		}

		document.getElementsByName('font-shadow-px')[0].textContent = font_shadow.toFixed(1)
		putOptionSaveData('font-shadow-px' , font_shadow.toFixed(1))
		set_status_setting()
	});
	document.getElementsByName('font-shadow-px')[0].addEventListener('focusout', function (event){
		font_shadow = +Number(event.target.textContent)
		if(isNaN(font_shadow)){
			font_shadow = 0.7
		}
		if(font_shadow > 3){
			font_shadow = 3
		}
		if(font_shadow <= 0){
			font_shadow = 0
		}

		document.getElementsByName('roma-font-spacing-px')[0].textContent = font_shadow.toFixed(1)
		putOptionSaveData('roma-font-spacing-px' , font_shadow.toFixed(1))
		set_status_setting()
	});
	document.getElementById("font-size-reset").addEventListener('click', function (){
		document.getElementsByName('kana-font-size-px')[0].textContent = "21.0"
		putOptionSaveData('kana-font-size-px' , "21.0")
		document.getElementsByName('roma-font-size-px')[0].textContent = "17.0"
		putOptionSaveData('roma-font-size-px' , "17.0")
		document.getElementsByName('kana-font-spacing-px')[0].textContent = "0.7"
		putOptionSaveData('kana-font-spacing-px' , "0.7")
		document.getElementsByName('roma-font-spacing-px')[0].textContent = "0.7"
		putOptionSaveData('roma-font-spacing-px' , "0.7")
		document.getElementsByName('font-shadow-px')[0].textContent = "0.6"
		putOptionSaveData('font-shadow-px' , "0.6")
		set_status_setting()
	});
}

function color_default(){
	document.getElementsByName('next-character-color')[0].value = "#FFFFFF"
	document.getElementsByName('lyric-color')[0].value = "#FFFFFF"
	document.getElementsByName('word-color')[0].value = "#FFFFFF"

	document.getElementsByName('next-character-color')[0].style.backgroundColor="rgb(255, 255, 255)"
	document.getElementsByName('next-character-color')[0].style.color="rgb(0, 0, 0)"
	document.getElementsByName('lyric-color')[0].style.backgroundColor="rgb(255, 255, 255)"
	document.getElementsByName('lyric-color')[0].style.color="rgb(0, 0, 0)"
	document.getElementsByName('word-color')[0].style.backgroundColor="rgb(255, 255, 255)"
	document.getElementsByName('word-color')[0].style.color="rgb(0, 0, 0)"

	document.getElementsByName('correct-word-color')[0].value = "#0099CC"
	document.getElementsByName('correct-word-color')[0].style.backgroundColor="rgb(0, 153, 204)"
	document.getElementsByName('correct-word-color')[0].style.color="rgb(255, 255, 255)"

	document.getElementsByName('line-clear-color')[0].value = "#1eff52"
	document.getElementsByName('line-clear-color')[0].style.backgroundColor="rgb(30, 255, 82)"
	document.getElementsByName('line-clear-color')[0].style.color="rgb(255, 255, 255)"

	document.getElementsByName('next-lyric-color')[0].value = "rgba(255,255,255,.7)"
	document.getElementsByName('next-lyric-color')[0].style.backgroundColor="rgba(255, 255, 255, 0.7)"
	document.getElementsByName('next-lyric-color')[0].style.color="rgb(0, 0, 0)"
	saveModOption()

}
function letter_red(){
	document.getElementsByName('next-character-color')[0].value = "#FF0000"
	document.getElementsByName('next-character-color')[0].style.backgroundColor="rgb(255, 0, 0)"
	document.getElementsByName('next-character-color')[0].style.color="rgb(255, 255, 255)"

	document.getElementsByName('lyric-color')[0].value = "#FFFFFF"
	document.getElementsByName('word-color')[0].value = "#FFFFFF"
	document.getElementsByName('lyric-color')[0].style.backgroundColor="rgb(255, 255, 255)"
	document.getElementsByName('lyric-color')[0].style.color="rgb(0, 0, 0)"
	document.getElementsByName('word-color')[0].style.backgroundColor="rgb(255, 255, 255)"
	document.getElementsByName('word-color')[0].style.color="rgb(0, 0, 0)"

	document.getElementsByName('correct-word-color')[0].value = "#919395"
	document.getElementsByName('correct-word-color')[0].style.backgroundColor="rgb(145, 147, 149)"
	document.getElementsByName('correct-word-color')[0].style.color="rgb(255, 255, 255)"

	document.getElementsByName('line-clear-color')[0].value = "#919395"
	document.getElementsByName('line-clear-color')[0].style.backgroundColor="rgb(145, 147, 149)"
	document.getElementsByName('line-clear-color')[0].style.color="rgb(255, 255, 255)"

	document.getElementsByName('next-lyric-color')[0].value = "rgba(255,255,255,.7)"
	document.getElementsByName('next-lyric-color')[0].style.backgroundColor="rgba(255, 255, 255, 0.7)"
	document.getElementsByName('next-lyric-color')[0].style.color="rgb(0, 0, 0)"
	saveModOption()

}
function letter_input_style(){
	document.getElementsByName('next-character-color')[0].value = "#777777"
	document.getElementsByName('next-character-color')[0].style.backgroundColor="rgb(119, 119, 119)"
	document.getElementsByName('next-character-color')[0].style.color="rgb(255, 255, 255)"

	document.getElementsByName('lyric-color')[0].value = "#FFFFFF"
	document.getElementsByName('lyric-color')[0].style.backgroundColor="rgb(255, 255, 255)"
	document.getElementsByName('lyric-color')[0].style.color="rgb(0, 0, 0)"
	document.getElementsByName('word-color')[0].value = "#777777"
	document.getElementsByName('word-color')[0].style.backgroundColor="rgb(119, 119, 119)"
	document.getElementsByName('word-color')[0].style.color="rgb(255, 255, 255)"

	document.getElementsByName('correct-word-color')[0].value = "#FFFFFF"
	document.getElementsByName('correct-word-color')[0].style.backgroundColor="rgb(255, 255, 255)"
	document.getElementsByName('correct-word-color')[0].style.color="rgb(0, 0, 0)"

	document.getElementsByName('line-clear-color')[0].value = "#1eff52"
	document.getElementsByName('line-clear-color')[0].style.backgroundColor="rgb(30, 255, 82)"
	document.getElementsByName('line-clear-color')[0].style.color="rgb(255, 255, 255)"

	document.getElementsByName('next-lyric-color')[0].value = "rgba(255,255,255,.7)"
	document.getElementsByName('next-lyric-color')[0].style.backgroundColor="rgba(255, 255, 255, 0.7)"
	document.getElementsByName('next-lyric-color')[0].style.color="rgb(0, 0, 0)"
	saveModOption()

}
function transparent_style(){
	document.getElementsByName('next-character-color')[0].value = "#FFFFFF"
	document.getElementsByName('lyric-color')[0].value = "#FFFFFF"
	document.getElementsByName('word-color')[0].value = "#FFFFFF"

	document.getElementsByName('next-character-color')[0].style.backgroundColor="rgb(255, 255, 255)"
	document.getElementsByName('next-character-color')[0].style.color="rgb(0, 0, 0)"
	document.getElementsByName('lyric-color')[0].style.backgroundColor="rgb(255, 255, 255)"
	document.getElementsByName('lyric-color')[0].style.color="rgb(0, 0, 0)"
	document.getElementsByName('word-color')[0].style.backgroundColor="rgb(255, 255, 255)"
	document.getElementsByName('word-color')[0].style.color="rgb(0, 0, 0)"

	document.getElementsByName('correct-word-color')[0].value = "transparent"
	document.getElementsByName('correct-word-color')[0].style.backgroundColor="rgb(0, 0, 0)"
	document.getElementsByName('correct-word-color')[0].style.color="rgb(0, 0, 0)"

	document.getElementsByName('line-clear-color')[0].value = "transparent"
	document.getElementsByName('line-clear-color')[0].style.backgroundColor="rgb(0, 0, 0)"
	document.getElementsByName('line-clear-color')[0].style.color="rgb(0, 0, 0)"

	document.getElementsByName('next-lyric-color')[0].value = "rgba(255,255,255,.7)"
	document.getElementsByName('next-lyric-color')[0].style.backgroundColor="rgba(255, 255, 255, 0.7)"
	document.getElementsByName('next-lyric-color')[0].style.color="rgb(0, 0, 0)"
	saveModOption()

}



var line_color_styles_html = document.createElement('style');
line_color_styles_html.setAttribute("id", "line_color_styles");
var status_setting_html = document.createElement('style');
status_setting_html.setAttribute("id", "status_setting");


let db;
let indexedDB = window.indexedDB || window.mozIndexedDB || window.msIndexedDB;
let OptionDatabaseObject = {}
const STORE_NAME = "TypingTubeModDb";

(function accessIndexedDB(){
	const OPEN_REQUEST = indexedDB.open(STORE_NAME, 1.0);

	//データベースストア新規作成。(初回アクセス時)
	OPEN_REQUEST.onupgradeneeded = function(event) {
		// データベースのバージョンに変更があった場合(初めての場合もここを通ります。)
		db = event.target.result;
		const CREATE_STORE = db.createObjectStore(STORE_NAME, { keyPath: "OptionName"});
	}

	//データベースストアアクセス成功時。
	OPEN_REQUEST.onsuccess = function(event) {
		db = event.target.result;
	    getAllIndexedDbData(loadIndexedDbData)
	}
})();

function getAllIndexedDbData (callback){

	const TRANSACTION = db.transaction([STORE_NAME], "readwrite");
	const STORE = TRANSACTION.objectStore(STORE_NAME);

	//すべてのキーを取得
	const REQUEST = STORE.getAll();
	REQUEST.onsuccess = function (event) {
		if (event.target.result === undefined) {
			// キーが存在しない場合の処理
		} else {
			// 取得成功
			OptionDatabaseObject = event.target.result
			if(callback()){
				callback()
			}
		}
	}
}


function loadIndexedDbData(){


	for (let i=0; i<OptionDatabaseObject.length; i++){

		const SAVE_DATA_VALUE = OptionDatabaseObject[i].Data
		const MOD_CONFIG_ELEMENT = play_mode == 'normal' ? document.getElementsByName(OptionDatabaseObject[i].OptionName) : document.querySelectorAll(`#practice-setting [name='${OptionDatabaseObject[i].OptionName}']`)
		if(MOD_CONFIG_ELEMENT[0] === null || MOD_CONFIG_ELEMENT[0] === undefined){
			continue;
		}

		if( MOD_CONFIG_ELEMENT[0].tagName === 'SELECT' ){
			MOD_CONFIG_ELEMENT[0].options[ SAVE_DATA_VALUE ].selected = true
		}else if(MOD_CONFIG_ELEMENT[0].tagName === 'SPAN'){
			MOD_CONFIG_ELEMENT[0].textContent = SAVE_DATA_VALUE;
		}else if( MOD_CONFIG_ELEMENT[0].type === 'checkbox' ){
			MOD_CONFIG_ELEMENT[0].checked = SAVE_DATA_VALUE;
		}else if( MOD_CONFIG_ELEMENT[0].type === 'radio' ){
			MOD_CONFIG_ELEMENT[SAVE_DATA_VALUE].checked = true;
		}else{
			MOD_CONFIG_ELEMENT[0].value = SAVE_DATA_VALUE;
		}

		if(OptionDatabaseObject[i].OptionName === 'miss-sound-effect' && SAVE_DATA_VALUE === true){
			document.getElementById("miss-sound-effect-beginning-line").style.display = "";
		}
		if(OptionDatabaseObject[i].OptionName === 'initial-time-diff'){
			initialTimeDiff = +SAVE_DATA_VALUE
			document.getElementById("time_diff").textContent = SAVE_DATA_VALUE
		}
		if(play_mode == 'practice'){
			OPTION_ACCESS_OBJECT[OptionDatabaseObject[i].OptionName] = document.getElementsByName(OptionDatabaseObject[i].OptionName)[0].checked
		}
	}






	//CSS設定を反映
	CONTROLBOX_SELECTOR.style.backgroundColor = document.getElementsByName('playarea-color')[0].value;
	CONTROLBOX_SELECTOR.style.paddingBottom = "6px";

	document.getElementById("esckey").style.color = document.getElementsByName('status-area-color')[0].value;
	for(let i=0;i<document.getElementsByClassName("playButton").length;i++){
		document.getElementsByClassName("playButton")[i].style.color = document.getElementsByName('status-area-color')[0].value;
	}


	document.head.appendChild(line_color_styles_html);
	document.head.appendChild(status_setting_html);
	updateProgressStyleTag()



	//入力モード設定をlocalStorageに保存するイベントリスナーを追加
	document.getElementsByName('mode_select')[0].addEventListener('change', saveModOption);
	document.getElementsByName('mode_select')[1].addEventListener('change', saveModOption);
	if(document.getElementsByName('mode_select')[2] != null){
		document.getElementsByName('mode_select')[2].addEventListener('change', saveModOption);
		document.getElementsByName('mode_select')[3].addEventListener('change', saveModOption);
	}

	//タイピングエリアのstatus rankingの部分にアンダーラインを追加するイベントリスナー
	document.querySelector(".col-4 .nav").addEventListener('click', function (){
		if(document.querySelector("#ranking").style.display == 'block'){
			document.querySelector(".status .nav").children[0].classList.remove('underline');
			document.querySelector(".status .nav").children[1].classList.add('underline');
		}else if(document.querySelector("#status").style.display == 'block'){
			document.querySelector(".status .nav").children[0].classList.add('underline');
			document.querySelector(".status .nav").children[1].classList.remove('underline');
		}});


	checkbox_effect()
};




function updateProgressStyleTag(){

	if(window.navigator.userAgent.indexOf('Firefox') != -1) {
		line_color_styles_html.innerHTML=`#bar_input_base::-moz-progress-bar {
    background-color:${document.getElementsByName('phrase-line-color')[0].value}!important;
}
#bar_input_base {
    background-color:${document.getElementsByName('phrase-line-empty-color')[0].value}!important;
}
#bar_base::-moz-progress-bar {
    background-color:${document.getElementsByName('movie-line-color')[0].value}!important;
}
#bar_base {
    background-color:${document.getElementsByName('movie-line-empty-color')[0].value}!important;
}

#controlbox .col-4,
#controlbox .col-4 a,
#controlbox .col-4 .h4,
#line_remaining_time,
#total-time{
    color:${document.getElementsByName('status-area-color')[0].value}!important;}

.combo-counter-effect-color {
    color:${document.getElementsByName('combo-counter-effect-color')[0].value}!important;}`;
	}else{
		line_color_styles_html.innerHTML=`#bar_input_base::-webkit-progress-value{
    background-color:${document.getElementsByName('phrase-line-color')[0].value}!important;
}
#bar_input_base[value]::-webkit-progress-bar {
    background-color:${document.getElementsByName('phrase-line-empty-color')[0].value}!important;
}

#bar_base::-webkit-progress-value {
    background-color:${document.getElementsByName('movie-line-color')[0].value}!important;
}
#bar_base[value]::-webkit-progress-bar{
    background-color:${document.getElementsByName('movie-line-empty-color')[0].value}!important;
}
#controlbox .col-4,
#controlbox .col-4 a,
#controlbox .col-4 .h4,
#line_remaining_time,
#total-time{
    color:${document.getElementsByName('status-area-color')[0].value}!important;}


.combo-counter-effect-color {
    color:${document.getElementsByName('combo-counter-effect-color')[0].value}!important;
   }`;

	}
}

function addCss() {
	const progress_bar_style = window.navigator.userAgent.indexOf('Firefox') != -1 ? `progress{width:100%;height:5px!important;;appearance:none;margin-top:1vw;}` : `progress{width:100%;height:3px!important;-webkit-appearance: scale-horizontal;appearance: scale-horizontal;margin-top:1vw;}`
	const play_css = document.createElement('style')
	play_css.type = 'text/css';
	play_css.innerHTML =
		`#kashi_roma:after,#kashi_sub:after,#skip-guide:after,#kashi_next:after,#next-kpm:after,#combo-value:after{content:'\u200b';}
.bar_text{display: flex;justify-content: space-between;align-items: baseline;position: relative;}
.flex_space_between{display: flex;justify-content: space-between;}
#combo-value{position: relative;top: -3px;font-size: 20px;}
#complete_effect{font-size: 140%;letter-spacing: 2px;position: absolute;left: 50%;transform: translate(-50%);-webkit-transform: translate(-50%);}
#line_remaining_time{font-size: 14px;}
#count-anime{
    font-size: 45px;
    font-weight: 600;
    position: relative;
}
#count-anime > span{
    position: absolute;
    top: 1rem;
    left: 50%;
    transform: translate(-50%, -50%);
    -webkit-transform: translate(-50%, -50%);
    -ms-transform: translate(-50%, -50%);
}
body ::-webkit-scrollbar {
    width: 10px;
    background-color: rgb(0 0 0 / 39%);
    -webkit-border-radius: 100px;
    height:10px;
}
body ::-webkit-scrollbar-corner {
  background:transparent;
}
body ::-webkit-scrollbar-thumb {
    background: hsla(0,0%,100%,.5);
    -webkit-border-radius: 100px;
    background-clip: padding-box;
    border: 2px solid hsla(0,0%,100%,0);
    min-height: 10px;
}

.status_border {
    border-bottom: solid thin;
    opacity: 0.25;
}
.status_name{font-weight:normal;margin-left:1.5px;}
.flex_space_between{display: flex;justify-content: space-between;}
#missmark{text-shadow: initial;}
.gothicfont{font-family: Segoe UI , "Yu Gothic","YuGothic",sans-serif !important;}
#kashi_area{cursor:none!important;user-select: none !important;-ms-user-select: none !important;-moz-user-select: none !important;-webkit-user-select: none !important;}
.select_none{user-select: none !important;-ms-user-select: none !important;-moz-user-select: none !important;-webkit-user-select: none !important;}
[onclick='submit_score()']:after,[onclick='submit_kana_score()']:after{content:'Enterキーでランキング送信';}
.character-scroll{white-space: nowrap;position:relative;height: 1.5em;overflow:hidden;}
.jp_word{word-break:break-all;}
.eng_word{word-wrap: break-word;overflow-wrap:break-word;}
.daken_moji{font-family:sans-serif;letter-spacing: 0.7px;font-weight:normal;}
.progress{margin-bottom: 0!important;}
#kashi_sub{margin-bottom:0.5rem;}
#kashi{font-size:1.65rem;}
#kashi_next{margin-top:0px!important; text-overflow: ellipsis;}
#controlbox .col-6{padding-right: 0!important;}
#controlbox{margin-left:0px!important;    padding-top: 6px;}
#status{font-size:1.4rem;white-space: nowrap;letter-spacing:0.1em;margin-bottom: 0;}
#life,#keep{font-size: 80%;background: rgb(0 0 0 / 60%);padding: 3px 7px 3px 7px;border-radius: 15px;color:gold;}
.correct_sub{line-height:0;padding-top: 8px;padding-bottom:15.5px;font-size:95%;font-weight:normal;}
#total-time{font-weight:600;color:#fff;font-family: sans-serif;}
#seek_line_close:hover{  cursor: pointer;text-decoration : underline;}
.practice-mode .result_lyric:hover{  cursor: pointer; text-decoration: underline;background: rgb(0 0 0 / 60%);
    width: fit-content;
    padding-right: 7px;
    border-radius: 5px;
	}
#typing-line-list-container {
    text-indent: 5px;
	background-color: rgba(0,0,0,.33);
    position: relative;
    }
#typing-line-result {
    word-break: break-all;
    overflow: scroll;
    max-height: 700px;
    font-size: 130%;
    font-weight: 600;
    list-style-type: none;
    padding-left: 0;
}
#line-result-head {
    font-size:21px;
    margin:0px!important;
    padding-bottom: 5px;
    color:#FFF;
	font-weight: 600;
}
#gauge2{height:13px!important;border-top:thin #FFEB3B solid;border-right:thin #FFEB3B solid;border-bottom:thin #FFEB3B solid;}
.kashi_omit{
        overflow: hidden;
        white-space: nowrap;}
.col-4{padding-top:4px;}
#gauge{width: 75%;padding-left: 10px;}
.underline, .hover_underline:hover{text-decoration: underline;}
.uppercase{text-transform:uppercase;}
.lyric_space{text-indent: -1rem;}
#btn_container{
    display: flex;
    margin-top: 10px;
    align-content: stretch;
    flex-direction: column;
    justify-content: center;
    flex-wrap: wrap;
    align-items: flex-end;
}
.result_lyric {
    list-style-type: none;
}
ol .result_lyric {
    margin-bottom: 3rem;
}
.seikou,.sippai{
   margin-left:5px;
}
.line_numbering{
    text-indent:2px;
    font-size:80%;
    font-weight:normal;
}
.flex_status_position{margin-left: 3px;position:relative;}
#status td{
position: relative;
}
.status_label{
    position: absolute;
    top:1rem;
    left: -40px;
    font-size:75%;
}
.flex_status_border{
    border-top: solid thin;
    position: absolute;
    width: 100%;
    bottom: 0.5px;
    min-width: 5.5rem;
    left: -2px;
}


${progress_bar_style}
div#gauge1 {
    position: relative;
    top: 5px;
    border-top: thin solid;
    border-bottom: thin solid;
    border-left: thin solid;
}
.progress2{margin-bottom: 0.5vw; -webkit-box-shadow: inset 0 0.1vw 0.2vw rgba(0,0,0,.1);box-shadow: inset 0 0.1vw 0.2vw rgba(0,0,0,.1);border-radius: 0;display: flex;font-size: .75rem;line-height: 3px;text-align: center;background-color: rgba(255,255,255,.1);}

.combo_animated {
	animation-duration: 0.6s;
	animation-fill-mode: both;
}


@keyframes combo_anime {
	0% {
		transform:scale(1.1,1.2);
	} 2% {
		transform:scale(1.1,1.3);
	} 9% {
		transform:scale(1,1);
	}
}

#combo_anime {
	animation-name: combo_anime;
    display: inline-block;
}

.count_animated {
	-webkit-animation-duration: 1s;
	animation-duration: 1s;
	-webkit-animation-fill-mode: both;
	animation-fill-mode: both;
}


@keyframes countdown_animation {
	from {
		opacity: 1;
	} to {
		opacity: 0.0;
	} 10% {
		opacity: 0.9;
	} 20% {
		opacity: 0.8;
	} 30% {
		opacity: 0.7;
	} 40% {
		opacity: 0.6;
	} 50% {
 		opacity: 0.5;
	} 60% {
		opacity: 0.4;
	} 70% {
		opacity: 0.3;
	} 80% {
		opacity: 0.2;
	} 90% {

		opacity: 0.1;
	}
}
.complete_animated {
	-webkit-animation-duration: 0.7s;
	animation-duration: 0.7s;
	-webkit-animation-fill-mode: both;
	animation-fill-mode: both;
}
.countdown_animation {
	-webkit-animation-name: countdown_animation;
	animation-name: countdown_animation;
	-webkit-transform-origin: center center;
	transform-origin: center center;
}
#volume_control {
  -webkit-appearance: none;
  width: 11rem;
  background: transparent;
}

#volume_control:focus {
  outline: none;
}

#volume_control::-webkit-slider-runnable-track {
  height: 1.5rem;
  margin: 0;
  width: 100%;
  background: #464646;
  background: linear-gradient(
    to bottom right,
    transparent 50%,
    #000000bb 50%
  );
}

#volume_control::-moz-range-track {
  height: 1.5rem;
  margin: 0;
  width: 100%;
  background: #464646;
  background: linear-gradient(
    to bottom right,
    transparent 50%,
     #000000bb 50%
  );
}


#volume_control::-webkit-slider-thumb {
  -webkit-appearance: none;
  height: 1.9rem;
  width: 0.5rem;
  background: #ffffff;
  border: 1px solid;
  margin-top: -3px;
  border-radius: 3px;
}



#volume_control::-moz-range-thumb {
  -webkit-appearance: none;
  height: 1.9rem;
  width: 0.5rem;
  background: #ffffff;
  border: 1px solid;
  border-radius: 3px;
  margin-top: 0;
}

#volume_control:focus::-moz-range-thumb {
  box-shadow: 0px 0px 7px 3px #0065c4;
}
.control_option{
    color:rgba(255,255,255,.85);
    background:transparent;
    border:outset thin;
    border-radius: 15px;
    padding-left: 8px;
    padding-right: 8px;
display:inline-flex;
}
.time_adjust_head{
    border: solid thin #777;
    background: #222;
    color: #eee;
    display: inline-flex;
    align-items: center;
}
[id*="time_settings"]{
    margin-top: 8px;
    width: 100%;
    justify-content: space-between;
    align-items: baseline;
}
#time_{
transform: scale(0.8,0.8);
margin-right:5px;
position:relative;
top:0.5px;
left: -4px;
}
#time_diff{
    transform: scale(1.1,1.1);
    position: relative;
    left: -4px;
}
#more_shortcutkey{
    background: #4d4d4d;
    color: #ccc;
    border: solid thin #777;
    padding-right:0px;
    padding-left:0px;
}
#restart span{
    transform: scale(0.9,0.9);
}
#more_shortcutkey span{
    transform: scale(0.8,0.8);
}
.shortcut_navi{
    background: #4d4d4d;
    color:#ccc;
    padding:1px 5px 2px 5px;
    border-radius: 5px;
    margin-left: 2px;
}
.shortcut-navi-display-block {
    display:block;
    background: #4d4d4d;
    color: #ccc;
    margin-left: auto;
    margin-right: auto!important;
    width: min-content;
    padding: 1px 3px 1px 3px;
    border-radius: 5px;
	margin-top: 3px;
    font-size: 10px;
}
.control-option2 {
    border-radius: 15px;
    width: 12rem;
    display: inline-flex;
    justify-content: center;
    border: none;
    padding: 1px 10px 0px 10px;
    color: #FFF;
}
.short_popup{
    position: absolute;
    background: hsl(0deg 0% 8%);
    border: solid #FFF;
    z-index: 5;
    font-weight: 600;
    display:none;
	padding-top:1.5rem;
}
#shortcut {
    top: 252px;
    right: 0;
}
#shortcut > div{
margin-bottom:1.5rem;
display: flex;
justify-content: flex-start;
}
#practice_shortcutkeys > div{
margin-bottom:12px;
}
.line-list-text-shadow{
    text-shadow: 0.6px 0.6px 0px #000, -0.6px -0.6px 0px #000, -0.6px 0.6px 0px #000, 0.6px -0.6px 0px #000, 0.6px 0px 0px #000, -0.6px 0px 0px #000, 0px 0.6px 0px #000, 0px -0.6px 0px #000;
}
`
	document.getElementsByTagName('HEAD').item(0).appendChild(play_css);

	var setting_css = document.createElement('style')
	setting_css.type = 'text/css';
	setting_css.innerHTML=`
#mod-menu label:not(.default-pointer),#mod-menu details,#mod-menu button,#mod-menu .color,#mod-menu select,.col-6 label,.status .nav-fill,.cursor-pointer{cursor: pointer;}
#mod-menu label{margin-right: 5px;}
#modal-open:hover,.pointer:hover{  cursor: pointer;text-decoration : underline;}
.help_pointer:hover{  cursor: help;text-decoration : underline;}
.caret:hover{  cursor: text;    background: #ffffff45;
    border-radius: 3px;}
.ui-dialog-buttonset button:last-of-type{opacity:0.5;zoom:70%;}
.fa-cog:hover{transform:rotate(90deg);}
/*タブのスタイル*/
.tab-item {
  width: calc(100%/4);
  height: 30px;
  line-height: 30px;
  overflow:hidden;
  font-size: 16px;
  text-align: center;
  color: #565656;
  display: block;
  float: left;
  text-align: center;
  transition: all 0.2s ease;
  margin:0px!important;
  border-left: 1px solid #fff;
  border-top: 1px solid #fff;
  border-bottom:2px solid #aaa;

}
.form-control {
    border-width: 0 0 1px;
    padding-left: 1px;
    padding-right: 1px;
    resize: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    -ms-overflow-style: none;
}
.p-0 {
    padding: 0!important;
}
.form-control-sm {
    padding: .25rem .55rem;
    font-size: .875rem;
    line-height: 1.5;
    border-radius: 0;
}

.mod-menu-round-wrapper{
    border: solid thin;
    padding-left: 1rem;
    transform: scale(0.9);
    border-radius: 30px;
}
.colorChooser {

    top: -130px;
zoom:80%;
}
.tab-item:hover{
    border-left: 1px solid #ffcd05!important;
    border-top: 1px solid #ffcd05!important;

  color: #ffcd05!important;
}
[for="etc"]{
    border-right: 1px solid #fff;
}
[for="etc"]:hover{
    border-right: 1px solid #ffcd05!important;

}
[for="all"]:hover~[for="design"],
[for="design"]:hover~[for="playcolor"],
[for="playcolor"]:hover~[for="etc"],
[for="etc"]:hover~.solid
{
    border-left: 1px solid #ffcd05!important;

}
.mod-tab-content-description{
    white-space: nowrap;
border-bottom:1px solid #fff;
border-left:1px solid #fff;
border-right:1px solid #fff;
overflow: scroll;
max-height: 380px;
display:flex;
flex-direction: column;
}

.mod-tab-content-description h6{
margin-bottom: 8px;
margin-left: 10px;
}
.mod-tab-content-description label {
margin-left: 10px;
display:block;
}
.mod-tab-content-description label input {
margin-right: 5px;
margin-left: 5px;
}
form #mod-menu p {
    margin-bottom: 0;
}
/*ラジオボタンを全て消す*/
input[name="tab-item"],input[name="input_page"],input[name="details"] {
  display: none;
}

/*タブ切り替えの中身のスタイル*/
.mod-tab-content,
.page_content{
  display: none;
  clear: both;

}
        select {
        font-weight: 600;
        padding: 5px 8px;
        width: 130%;
        color:#FFF;
        box-shadow: none;
        background-color: #000000CC;
        background-image: none;
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;
        border-radius: 5px;
        width: auto;
        }
        select:focus {
        outline: none;
        }
        select:hover{
        background:#1E90FF;
        }
        option{
        background:#333;
        color:#FFF;
       }
.mod-tab-content h6{
padding-top: 10px;
}
.input_page{
margin-bottom:2px;
padding-top: 7.5px;
margin-left: 0px!important;

}
.input_page:hover{
text-decoration: underline;
}
.folded-luled-line{
    font-size: 1.5rem;
    position: relative;
    bottom: 6px;
    left: 3px;
    font-family: cursive;
}
.three-digits[type=number]{
width: 46px;
}
.four_digits[type=number]{
width: 50px;
}
.sound-effect-list{
    display: flex;
    align-items: center;
}

input[type="number"]::-webkit-outer-spin-button,
input[type="number"]::-webkit-inner-spin-button {
cursor:pointer;
}
.mod-tab-content [id*='config']:not(:first-of-type){
border-top-style: inset;
}
#status-config{
margin-bottom:10px;
}
.mod-tab-content-description > [id*='config']:last-of-type{
margin-bottom:30px;
}
.mod-tab-content [id*='config']{
margin:0 10px 0 10px;
}
#input-config h6{
margin-right:10px;
}
#miss-limit-mode-config{
    justify-content: flex-start;
    align-items: flex-end;
    margin-bottom: 4px;
}
#character-scroll-config{
    justify-content: flex-start;
    align-items: center;
}
#difficult > span > span:nth-of-type(-n+4) {
    margin-right: 0.9rem;
}
.EntrySymbol{
margin-bottom:0.5rem;
}
.AppearanceSymbol {
    font-size: large;
}
.SymbolColumn{
display: inline-flex;
flex-direction: column;
}
.SymbolColumn:not(:last-child){
margin-right:3rem;
}
/*選択されているタブのコンテンツのみを表示*/
#all:checked ~ #all-content,
#design:checked ~ #design-content,
#playcolor:checked ~ #playarea-color-content,
#etc:checked ~ #etc-content,
#page1:checked ~ #page1_content,
#page2:checked ~ #page2_content{
  display: block!important;
}

/*選択されているタブのスタイルを変える*/
input:checked + .tab-item {
border-bottom:hidden;

  color: #fff!important;
}
input:checked + .input_page {

  color: #919395!important;
}
#modal-overlay{
z-index:101;display:none;position:fixed;top:0;left:0;width:100%;height:120%;
}


#osusume1,#osusume2 {
  cursor: pointer;
  width: 200px;
  border: 1px solid #ccc;
  border-radius: 4px;
  text-align: center;
  padding: 12px;
  margin: 0px auto 0;
  background: #4caf50;
  z-index: 105;

  color: white;
}
#osusume1 {
float:left;
}#osusume2{
float:right;
}
#mask {
  background: rgba(0, 0, 0, 0.4);
  position: fixed;
  top: 0;
  bottom: 0;
  right: 0;
  left: 0;
  z-index: 104;
}

#modal {
  background: #fff;
  color: #555;
  width: 520px;
  padding: 25px;
  border-radius: 4px;
  position: fixed;
  top: 270px;
  left: 0;
  right: 0;
  margin: 0 auto;
  z-index: 105;
}
#mask.hidden {
  display: none;
}

#modal.hidden {
  display: none;
}
.rgba-color-scroll-padding{
padding-bottom:130px;
    padding-top: 60px;
}
.c-txtsp{
    margin-bottom: 0;
}
`
	document.getElementsByTagName('HEAD').item(0).appendChild(setting_css);
}


function create_flick_textbox(){
	if(keyboard == "mac"){
		flick_form.setAttribute("style", "opacity:0.3;position:absolute;transform: scale(0);top:120px;");
		flick_form_second.setAttribute("style", "opacity:0;position:absolute;transform: scale(0);z-index:-1;top:120px;");
		document.getElementById("kashi").parentNode.insertBefore(flick_form, document.getElementById("kashi"));
		document.getElementById("kashi").parentNode.insertBefore(flick_form_second, document.getElementById("kashi"));
		document.getElementById("kashi_area").addEventListener("click",play_focus,true)
		starting_kashi_area()
		SELECTOR_ACCESS_OBJECT['flick-input'] = document.getElementById("flick-input")
		SELECTOR_ACCESS_OBJECT['flick-input'].addEventListener("focusout",flick_blur_notification)
		SELECTOR_ACCESS_OBJECT['flick-input'].addEventListener("focus",flick_focus)
		SELECTOR_ACCESS_OBJECT['flick-input'].addEventListener("change",settimeout_delete_flick_form)
		SELECTOR_ACCESS_OBJECT['flick-input-second'] = document.getElementById("flick-input-second")
		SELECTOR_ACCESS_OBJECT['flick-input-second'].addEventListener("focusout",flick_blur_notification)
		SELECTOR_ACCESS_OBJECT['flick-input-second'].addEventListener("focus",flick_focus)
		SELECTOR_ACCESS_OBJECT['flick-input-second'].addEventListener("change",settimeout_delete_flick_form)
		window.addEventListener("keydown",key_device_disabled)
		document.getElementById("kashi_area").insertAdjacentHTML('afterbegin', `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:a="http://ns.adobe.com/AdobeSVGViewerExtensions/3.0/"
id="tap_here" x="0px" y="0px" width="300px" height="300px" viewBox="0 0 400 500" style="z-index:-1;margin:auto;left:0;right:0;display:none;enable-background:new 0 0 455 455;position: absolute;top: -10%;" xml:space="preserve">
<style type="text/css">
	.st0{opacity:0.15;}
	.st1{opacity:0.15;stroke:#000000;stroke-width:10;stroke-miterlimit:10;}

.text {
  animation: bounce 1s linear infinite;
}

@keyframes bounce {
  10% {
    transform: translateY(-10px)
  }
  70% {
    transform: translateY(0)
  }
}
</style>
<circle class="st0" cx="200" cy="230" r="100"></circle>
<circle class="st1" cx="200" cy="230" r="105">
        <animate attributeName="r" from="105" to="130" begin="0s" dur="1s" repeatCount="indefinite"></animate>
        <animate attributeName="opacity" from="0.15" to="0" dur="1s" begin="0s" repeatCount="indefinite" fill="freeze" id="circ-anim"></animate>
</circle>
</svg>`)
	}
	play_focus()
	player.playVideo()
}

//MOD設定でプレイ前に必要な分を適用
function checkbox_effect(){
	if(!is_played && play_mode == "normal"){
		if(document.querySelector("[value=kana_type]").checked){
			kana_mode = false
			mode='kana'
			keyboard='normal';
			document.getElementById("kana-sub-display").style.display = "none"
			document.getElementById("roma-sub-display").style.display = "inline"
			document.getElementById("kana-main-font-size").style.display = "inline"
			document.getElementById("roma-sub-font-size").style.display = "inline"
			document.getElementById("roma-main-font-size").style.display = "none"
			document.getElementById("kana-sub-font-spacing").style.display = "none"
			document.getElementById("kana-main-font-spacing").style.display = "inline"
			document.getElementById("roma-sub-font-spacing").style.display = "inline"
			document.getElementById("roma-main-font-spacing").style.display = "none"
			document.getElementById("kana-sub-font-spacing").style.display = "none"
			kanaModeConfig.style.display = "none"
			romaModeConfig.style.display = "block"
			document.getElementById("practice-mode-button").removeEventListener("click",create_flick_textbox);
		}else if(document.querySelector("[value=roma_type]").checked){
			kana_mode = false
			mode='roma'
			keyboard='normal';
			document.getElementById("roma-sub-display").style.display = "none"
			document.getElementById("kana-sub-display").style.display = "inline"
			document.getElementById("roma-main-font-size").style.display = "inline"
			document.getElementById("kana-sub-font-size").style.display = "inline"
			document.getElementById("kana-main-font-size").style.display = "none"
			document.getElementById("roma-sub-font-size").style.display = "none"
			document.getElementById("kana-main-font-spacing").style.display = "none"
			document.getElementById("roma-sub-font-spacing").style.display = "none"
			document.getElementById("roma-main-font-spacing").style.display = "inline"
			document.getElementById("kana-sub-font-spacing").style.display = "inline"
			kanaModeConfig.style.display = "none"
			romaModeConfig.style.display = "block"
			document.getElementById("practice-mode-button").removeEventListener("click",create_flick_textbox);
		}else if(document.querySelector("[value=kanamode_type]").checked){
			kana_mode = true
			mode='kana'
			keyboard='normal';
			kanaModeConfig.style.display = "block"
			romaModeConfig.style.display = "none"
			document.getElementById("kana-main-font-size").style.display = "inline"
			document.getElementById("roma-sub-font-size").style.display = "inline"
			document.getElementById("roma-main-font-size").style.display = "none"
			document.getElementById("kana-sub-font-size").style.display = "none"
			document.getElementById("kana-main-font-spacing").style.display = "inline"
			document.getElementById("roma-sub-font-spacing").style.display = "inline"
			document.getElementById("roma-main-font-spacing").style.display = "none"
			document.getElementById("kana-sub-font-spacing").style.display = "none"
			document.getElementById("practice-mode-button").removeEventListener("click",create_flick_textbox);
		}else if(document.querySelector("[value=kanamode_mac_type]").checked){
			kana_mode = true
			mode='kana'
			keyboard='mac';
			kanaModeConfig.style.display = "block"
			romaModeConfig.style.display = "none"
			document.getElementById("kana-main-font-size").style.display = "inline"
			document.getElementById("roma-sub-font-size").style.display = "inline"
			document.getElementById("roma-main-font-size").style.display = "none"
			document.getElementById("kana-sub-font-size").style.display = "none"
			document.getElementById("kana-main-font-spacing").style.display = "inline"
			document.getElementById("roma-sub-font-spacing").style.display = "inline"
			document.getElementById("roma-main-font-spacing").style.display = "none"
			document.getElementById("kana-sub-font-spacing").style.display = "none"
			document.getElementById("practice-mode-button").addEventListener("click",create_flick_textbox);
		}


		if(document.querySelector(".playButton .underline")!=null){
			document.querySelector(".playButton .underline").classList.remove('underline');
		}

		document.querySelector("[name=mode_select]:checked").parentNode.classList.add('underline');
	}

	document.getElementById("gauge").style.display = document.getElementsByName('line-clear-gauge-effect')[0].checked ? "block" : "none";
}




//MODメニューを開いた時、プレイ開始時に必要な文を適用
function checkbox_effect_mod_open_play(){
	document.getElementById("character-scroll-config").style.display = document.getElementsByName('character-scroll')[0].checked ? "flex" : "none";
	document.getElementById("change-mode-config").style.display = document.getElementsByName('disable-change-mode')[0].checked ? "none" : "flex";
	document.getElementById("character-scroll-length-reset").style.display = document.getElementsByName('character-scroll')[0].checked ? "inline" : "none";
	document.getElementById("adjust-config").style.display = document.getElementsByName('play-scroll')[0].checked ? "flex" : "none";
	OPTION_ACCESS_OBJECT['sound-effect-interlocking-youtube-volume'] = document.getElementsByName('sound-effect-interlocking-youtube-volume')[0].checked
	if(OPTION_ACCESS_OBJECT['sound-effect-interlocking-youtube-volume']){
		for(let i=0;i<document.querySelectorAll("[name*='effect-volume']").length;i++){document.querySelectorAll("[name*='effect-volume']")[i].style.display = "none";}
	}else{
		for(let i=0;i<document.querySelectorAll("[name*='effect-volume']").length;i++){document.querySelectorAll("[name*='effect-volume']")[i].style.display = "block";}
	}

	if(document.getElementsByName('space-symbol-omit')[0].checked){
		document.getElementById("space-trace").style.display = "inline";
	}
	if(document.getElementsByName('miss-limit-mode')[0].checked){
		document.getElementById("miss-limit-mode-config").style.display = "flex";
	}else{
		document.getElementById("miss-limit-mode-config").style.display = "none";
	}
}





window.AudioContext = window.AudioContext || window.webkitAudioContext;
let key_type = miss_type = clear_type = combo_break = gameover_sound = new AudioContext();
let audioBuffer = {}

function LoadSoundEffect(loadAllSound){
	if(loadAllSound || !audioBuffer.KeyType && OPTION_ACCESS_OBJECT['typing-sound-effect']){
		fetch("/sounds/key_type.mp3").then(function(response) {
			return response.arrayBuffer();
		}).then(function(arrayBuffer) {
			key_type.decodeAudioData(arrayBuffer, function(buffer) {
				audioBuffer.KeyType = buffer;
			});
		})
	}
	if(loadAllSound || !audioBuffer.MissType && OPTION_ACCESS_OBJECT['miss-sound-effect']){
		fetch("/sounds/miss_type.mp3").then(function(response) {
			return response.arrayBuffer();
		}).then(function(arrayBuffer) {
			miss_type.decodeAudioData(arrayBuffer, function(buffer) {
				audioBuffer.MissType = buffer;
			});
		})
	}
	if(loadAllSound || !audioBuffer.ClearType && OPTION_ACCESS_OBJECT['clear-sound-effect']){
		fetch("/sounds/clear_type.mp3").then(function(response) {
			return response.arrayBuffer();
		}).then(function(arrayBuffer) {
			miss_type.decodeAudioData(arrayBuffer, function(buffer) {
				audioBuffer.ClearType = buffer;
			});
		})
	}
	if(loadAllSound || !audioBuffer.GameOver && OPTION_ACCESS_OBJECT['gameover-sound-effect'] && OPTION_ACCESS_OBJECT['miss-limit-mode']){
		fetch("/sounds/gameover.mp3").then(function(response) {
			return response.arrayBuffer();
		}).then(function(arrayBuffer) {
			gameover_sound.decodeAudioData(arrayBuffer, function(buffer) {
				audioBuffer.GameOver = buffer;
			});
		})
	}
	if(loadAllSound || !audioBuffer.ComboBreak && OPTION_ACCESS_OBJECT['combo-break-sound']){
		fetch("/sounds/combo_break.mp3").then(function(response) {
			return response.arrayBuffer();
		}).then(function(arrayBuffer) {
			combo_break.decodeAudioData(arrayBuffer, function(buffer) {
				audioBuffer.ComboBreak = buffer;
			});
		})
	}
};

function key_type_play(mute){
	let key_type_gain = key_type.createGain();
	let key_type_source = key_type.createBufferSource();
	key_type_source.buffer = audioBuffer.KeyType;
	key_type_source.connect(key_type_gain);
	key_type_gain.connect(key_type.destination);
	if(!mute){
		if(OPTION_ACCESS_OBJECT['sound-effect-interlocking-youtube-volume']){
			key_type_gain.gain.value = volume/100
		}else{
			key_type_gain.gain.value = OPTION_ACCESS_OBJECT['typing-effect-volume']
		}}else{
			key_type_gain.gain.value = 0
		}
	key_type_source.start(0,0.0005);
}

function miss_type_play(mute){
	let miss_type_gain = miss_type.createGain();
	let miss_type_source = miss_type.createBufferSource();
	miss_type_source.buffer = audioBuffer.MissType;
	miss_type_source.connect(miss_type_gain);
	miss_type_gain.connect(miss_type.destination);
	if(!mute){
		if(OPTION_ACCESS_OBJECT['sound-effect-interlocking-youtube-volume']){
			miss_type_gain.gain.value = volume/100
		}else{
			miss_type_gain.gain.value = OPTION_ACCESS_OBJECT['miss-effect-volume']
		}}else{
			miss_type_gain.gain.value = 0
		}
	miss_type_source.start(0);
}

function clear_type_play(mute){
	let clear_type_gain = clear_type.createGain();
	let clear_type_source = clear_type.createBufferSource();
	clear_type_source.buffer = audioBuffer.ClearType;
	clear_type_source.connect(clear_type_gain);
	clear_type_gain.connect(clear_type.destination);
	if(!mute){
		if(OPTION_ACCESS_OBJECT['sound-effect-interlocking-youtube-volume']){
			clear_type_gain.gain.value = volume/100
		}else{
			clear_type_gain.gain.value = OPTION_ACCESS_OBJECT['line-clear-effect-volume']
		}}else{
			clear_type_gain.gain.value = 0
		}
	clear_type_source.start(0);
}

function gameover_sound_play(mute){
	const gameover_sound_gain = gameover_sound.createGain();
	const gameover_sound_source = gameover_sound.createBufferSource();
	gameover_sound_source.buffer = audioBuffer.GameOver;
	gameover_sound_source.connect(gameover_sound_gain);
	gameover_sound_gain.connect(gameover_sound.destination);
	if(!mute){
		if(OPTION_ACCESS_OBJECT['sound-effect-interlocking-youtube-volume']){
			gameover_sound_gain.gain.value = volume/100
		}else{
			gameover_sound_gain.gain.value = OPTION_ACCESS_OBJECT['gameover-effect-volume']
		}}else{
			gameover_sound_gain.gain.value = 0
		}
	gameover_sound_source.start(0);
}


function combo_break_play(mute){
	let combo_break_gain = combo_break.createGain();
	let combo_break_source = combo_break.createBufferSource();
	combo_break_source.buffer = audioBuffer.ComboBreak;
	combo_break_source.connect(combo_break_gain);
	combo_break_gain.connect(combo_break.destination);
	if(!mute){
		if(OPTION_ACCESS_OBJECT['sound-effect-interlocking-youtube-volume']){
			combo_break_gain.gain.value = volume/100
		}else{
			combo_break_gain.gain.value = OPTION_ACCESS_OBJECT['combo-break-effect-volume']
		}}else{
			combo_break_gain.gain.value = 0
		}
	combo_break_source.start(0);
}








/*
*@ページを開いたときのMOD追加機能処理 ここから---
**/
/////////////////////////////////////////////////////////////////////////////////////////////////









/////////////////////////////////////////////////////////////////////////////////////////////////
/**
*@ページ読み込み時のタイピングワード生成処理 ここから---
*/

function press_start(){
	if(event.key=="F7"){
		if(!is_played){
			play_mode = "practice"
			player.playVideo()
		}
		event.preventDefault();
	}
	if((document.activeElement.tagName != "INPUT" || document.activeElement.type == "radio") && (event.key=="Enter" || event.key=="F4" )){
		if(!is_played){
			document.activeElement.blur();
			player.playVideo()}//Enterキーでプレイ開始
	}
}

function enter_ranking_entry(){
	if((document.activeElement.tagName != "INPUT" || document.activeElement.type == "radio") && event.key=="Enter"){
		if(finished && play_mode=="normal" && document.querySelector("#result_comment [type=button]") != null){//曲終了、Enterキーで記録送信
			if(kana_mode){submit_score()}
			document.querySelector("#result_comment [type=button]").click()
		}
	}
}

function mobile_sound_enables(){
	gameover_sound_play(true)
	combo_break_play(true)
	clear_type_play(true)
	miss_type_play(true)
	key_type_play(true)
}


const ranking_length = document.querySelectorAll(".player_ranking") //ランキングの人数
let ranking_array = []; //ランキングのスコア

let movie_mm; //曲の長さ(分)
let movie_ss; //曲の長さ(秒)
let volume = 70;

//YouTubeプレイヤーの準備が完了した時に処理
onPlayerReady = function (event) {
	get_video_thumbnail()

	if(!localStorage.getItem('volume_storage')){
		localStorage.setItem('volume_storage',volume)
	}

	volume = Number(localStorage.getItem('volume_storage'))

	if(isNaN(volume)){
		volume = 70
		localStorage.setItem('volume_storage',volume)
	}

	document.getElementsByClassName("btn")[0].parentElement.insertAdjacentHTML("beforebegin",`<label id="volume_control_area" style="
    display: flex;
    position: relative;
    align-items: baseline;
    margin-right: 42px;
    "><span><span style="
    position: absolute;
    z-index: -1;
    top: -22px;
    color: #FFFFFF88;
">Volume</span><input type="range" class="cursor-pointer" id="volume_control" value="70" step="1" max="100"><span style="margin-left: 10px;position: relative;"><span id="volume" style="
    background: #00000088;
    padding: 3px;
    border: solid thin;
    border-radius: 5px;
    position: absolute;
    top: -10px;
    min-width: 25px;
    text-align: center;
">`+volume+`</span></span></span></label>`)
	document.getElementById("volume").textContent = volume;
	document.getElementById("volume_control").value = volume
	document.getElementById("volume_control").addEventListener("input",function(event){
		volume = event.target.value
		player.setVolume(volume);
		document.getElementById("volume").textContent = volume;
		localStorage.setItem('volume_storage', volume);
	})

	if(navigator.userAgent.match(/(iPhone|iPod|iPad|Android.*Mobile)/i)){
		document.getElementById("volume_control_area").style.visibility = "hidden"
		LoadSoundEffect(true)
		OPTION_ACCESS_OBJECT['typing-effect-volume'] = document.getElementsByName('typing-effect-volume')[0].value/100
		OPTION_ACCESS_OBJECT['miss-effect-volume'] = document.getElementsByName('miss-effect-volume')[0].value/100
		OPTION_ACCESS_OBJECT['line-clear-effect-volume'] = document.getElementsByName('line-clear-effect-volume')[0].value/100
		OPTION_ACCESS_OBJECT['combo-break-effect-volume'] = document.getElementsByName('combo-break-effect-volume')[0].value/100
		OPTION_ACCESS_OBJECT['gameover-effect-volume'] = document.getElementsByName('gameover-effect-volume')[0].value/100
	}

	player.difftime = initialTimeDiff
	document.getElementById("time_adjust_minus").addEventListener("click",function time_adjust_minus(){
		player.difftime -= 0.1
		player.difftime = Math.round(player.difftime* 100)/100
		document.getElementById("time_diff").textContent = player.difftime.toFixed(2);
		play_focus()
	})
	document.getElementById("time_adjust_plus").addEventListener("click",function time_adjust_plus(){
		player.difftime += 0.1
		player.difftime = Math.round(player.difftime* 100)/100
		document.getElementById("time_diff").textContent = player.difftime.toFixed(2);
		play_focus()
	})

	player.setVolume(volume);
	completeIme();
}


let kigou_disable
let space_disable
parseRomaMap = function (){
	return [
		["0", "0"],
		["1", "1"],
		["2", "2"],
		["3", "3"],
		["4", "4"],
		["5", "5"],
		["6", "6"],
		["7", "7"],
		["8", "8"],
		["9", "9"],
		["ぎゃ", "gya", "gilya", "gixya"],
		["ぎぃ", "gyi", "gili", "gixi", "gilyi", "gixyi"],
		["ぎゅ", "gyu", "gilyu", "gixyu"],
		["ぎぇ", "gye", "gile", "gixe", "gilye", "gixye"],
		["ぎょ", "gyo", "gilyo", "gixyo"],
		["きゃ", "kya", "kilya", "kixya"],
		["きぃ", "kyi", "kili", "kixi", "kilyi", "kixyi"],
		["きゅ", "kyu", "kilyu", "kixyu"],
		["きぇ", "kye", "kile", "kixe", "kilye", "kixye"],
		["きょ", "kyo", "kilyo", "kixyo"],
		["ぐぁ", "gwa", "gula", "guxa"],
		["ぐぃ", "gwi", "guli", "guxi", "gulyi", "guxyi"],
		["ぐぅ", "gwu", "gulu", "guxu"],
		["ぐぇ", "gwe", "gule", "guxe", "gulye", "guxye"],
		["ぐぉ", "gwo", "gulo", "guxo"],
		["しゃ", "sya", "sha", "silya", "sixya", "shilya", "shixya", "cilya", "cixya"],
		["しぃ", "syi", "sili", "sixi", "silyi", "shixyi", "shili", "shixi", "shilyi", "shixyi", "cili", "cixi", "cilyi", "cixyi"],
		["しゅ", "syu", "shu", "silyu", "sixyu", "shilyu", "shixyu", "cilyu", "cixyu"],
		["しぇ", "sye", "she", "sile", "sixe", "silye", "sixye", "shile", "shixe", "shilye", "shixye", "cile", "cixe", "cilye", "cixye"],
		["しょ", "syo", "sho", "silyo", "sixyo", "shilyo", "shixyo", "cilyo", "cixyo"],
		["じゃ", "ja", "zya", "jya", "jilya", "jixya", "zilya", "zixya"],
		["じぃ", "zyi", "jyi", "jili", "jixi", "jilyi", "jixyi", "zili", "zixi", "zilyi", "zixyi"],
		["じゅ", "ju", "zyu", "jyu", "jilyu", "jixyu", "zilyu", "zixyu"],
		["じぇ", "je", "zye", "jye", "jile", "jixe", "jilye", "jixye", "zile", "zixe", "zilye", "zixye"],
		["じょ", "jo", "zyo", "jyo", "jilyo", "jixyo", "zilyo", "zixyo"],
		["すぁ", "swa", "sula", "suxa"],
		["すぃ", "swi", "suli", "suxi", "sulyi", "suxyi"],
		["すぅ", "swu", "sulu", "suxu"],
		["すぇ", "swe", "sule", "suxe", "sulye", "suxye"],
		["すぉ", "swo", "sulo", "suxo"],
		["ちゃ", "tya", "cya", "cha", "tilya", "tixya", "chilya", "chixya"],
		["ちぃ", "tyi", "cyi", "tili", "tixi", "tilyi", "tixyi", "chili", "chixi", "chilyi", "chixyi"],
		["ちゅ", "tyu", "cyu", "chu", "tilyu", "tixyu", "chilyu", "chixyu"],
		["ちぇ", "tye", "cye", "che", "tile", "tixe", "tilye", "tixye", "chile", "chixe", "chilye", "chixye"],
		["ちょ", "tyo", "cyo", "cho", "tilyo", "tixyo", "chilyo", "chixyo"],
		["ぢゃ", "dya", "dilya", "dixya"],
		["ぢぃ", "dyi", "dili", "dixi", "dilyi", "dixyi"],
		["ぢゅ", "dyu", "dilyu", "dixyu"],
		["ぢぇ", "dye", "dile", "dixe", "dilye", "dixye"],
		["ぢょ", "dyo", "dilyo", "dixyo"],
		["つぁ", "tsa", "tula", "tuxa", "tsula", "tsuxa"],
		["つぃ", "tsi", "tuli", "tuxi", "tulyi", "tuxyi", "tsuli", "tsuxi", "tsulyi", "tsuxyi"],
		["つぇ", "tse", "tule", "tuxe", "tulye", "tuxye", "tsule", "tsuxe", "tsulye", "tsuxye"],
		["つぉ", "tso", "tulo", "tuxo", "tsulo", "tsuxo"],
		["てゃ", "tha", "telya", "texya"],
		["てぃ", "thi", "t'i", "teli", "texi", "telyi", "texyi"],
		["てゅ", "thu", "t'yu", "telyu", "texyu"],
		["てぇ", "the", "tele", "texe", "telye", "texye"],
		["てょ", "tho", "telyo", "texyo"],
		["でゃ", "dha", "delya", "dexya"],
		["でぃ", "dhi", "d'i", "deli", "dexi", "delyi", "dexyi"],
		["でゅ", "dhu", "d'yu", "delyu", "dexyu"],
		["でぇ", "dhe", "dele", "dexe", "delye", "dexye"],
		["でょ", "dho", "delyo", "dexyo"],
		["とぁ", "twa", "tola", "toxa"],
		["とぃ", "twi", "toli", "toxi", "tolyi", "toxyi"],
		["とぅ", "twu", "t'u", "tolu", "toxu"],
		["とぇ", "twe", "tole", "toxe", "tolye", "toxye"],
		["とぉ", "two", "tolo", "toxo"],
		["どぁ", "dwa", "dola", "doxa"],
		["どぃ", "dwi", "doli", "doxi", "dolyi", "doxyi"],
		["どぅ", "dwu", "d'u", "dolu", "doxu"],
		["どぇ", "dwe", "dole", "doxe", "dolye", "doxye"],
		["どぉ", "dwo", "dolo", "doxo"],
		["にゃ", "nya", "nilya", "nixya"],
		["にぃ", "nyi", "nili", "nixi", "nilyi", "nixyi"],
		["にゅ", "nyu", "nilyu", "nixyu"],
		["にぇ", "nye", "nile", "nixe", "nilye", "nixye"],
		["にょ", "nyo", "nilyo", "nixyo"],
		["ひゃ", "hya", "hilya", "hixya"],
		["ひぃ", "hyi", "hili", "hixi", "hilyi", "hixyi"],
		["ひゅ", "hyu", "hilyu", "hixyu"],
		["ひぇ", "hye", "hile", "hixe", "hilye", "hixye"],
		["ひょ", "hyo", "hilyo", "hixyo"],
		["ぴゃ", "pya", "pilya", "pixya"],
		["ぴぃ", "pyi", "pili", "pixi", "pilyi", "pixyi"],
		["ぴゅ", "pyu", "pilyu", "pixyu"],
		["ぴぇ", "pye", "pile", "pixe", "pilye", "pixye"],
		["ぴょ", "pyo", "pilyo", "pixyo"],
		["びゃ", "bya", "bilya", "bixya"],
		["びぃ", "byi", "bili", "bixi", "bilyi", "bixyi"],
		["びゅ", "byu", "bilyu", "bixyu"],
		["びぇ", "bye", "bile", "bixe", "bilye", "bixye"],
		["びょ", "byo", "bilyo", "bixyo"],
		["ゔぁ", "va", "vula", "vuxa"],
		["ゔぃ", "vi", "vyi", "vuli", "vuxi", "vulyi", "vuxyi"],
		["ゔぇ", "ve", "vye", "vule", "vuxe", "vulye", "vuxye"],
		["ゔぉ", "vo", "vulo", "vuxo"],
		["ゔゃ", "vya", "vulya", "vuxya"],
		["ゔゅ", "vyu", "vulyu", "vuxyu"],
		["ゔょ", "vyo", "vulyo", "vuxyo"],
		["ふぁ", "fa", "fwa", "hwa", "fula", "fuxa", "hula", "huxa"],
		["ふぃ", "fi", "fwi", "hwi", "fuli", "fuxi", "fulyi", "fuxyi", "huli", "huxi", "hulyi", "huxyi"],
		["ふぅ", "fwu", "fulu", "fuxu", "hulu", "huxu"],
		["ふぇ", "fe", "fwe", "fye", "hwe", "fule", "fuxe", "fulye", "fuxye", "hule", "huxe", "hulye", "huxye"],
		["ふぉ", "fo", "fwo", "hwo", "fulo", "fuxo", "hulo", "huxo"],
		["ふゃ", "fya", "fulya", "fuxya", "hulya", "huxya"],
		["ふゅ", "fyu", "hwyu", "fulyu", "fuxyu", "hulyu", "huxyu"],
		["ふょ", "fyo", "fulyo", "fuxyo", "hulyo", "huxyo"],
		["みゃ", "mya", "milya", "mixya"],
		["みぃ", "myi", "mili", "mixi", "milyi", "mixyi"],
		["みゅ", "myu", "milyu", "mixyu"],
		["みぇ", "mye", "mile", "mixe", "milye", "mixye"],
		["みょ", "myo", "milyo", "mixyo"],
		["りゃ", "rya", "rilya", "rixya"],
		["りぃ", "ryi", "rili", "rixi", "rilyi", "rixyi"],
		["りゅ", "ryu", "rilyu", "rixyu"],
		["りぇ", "rye", "rile", "rixe", "rilye", "rixye"],
		["りょ", "ryo", "rilyo", "rixyo"],
		["いぇ", "ye", "ile", "ixe", "ilye", "ixye", "yile", "yixe", "yilye", "yixye"],
		["うぁ", "wha", "ula", "uxa", "wula", "wuxa", "whula", "whuxa"],
		["うぃ", "wi", "whi", "uli", "uxi", "ulyi", "uxyi", "wuli", "wuxi", "wulyi", "wuxyi", "whuli", "whuxi", "whulyi", "whuxyi"],
		["うぇ", "we", "whe", "ule", "uxe", "ulye", "uxye", "wule", "wuxe", "wulye", "wuxye", "whule", "whuxe", "whulye", "whuxye"],
		["うぉ", "who", "ulo", "uxo", "wulo", "wuxo", "whulo", "whuxo"],
		["くぁ", "qa", "qwa", "kwa", "kula", "kuxa", "qula", "quxa", "cula", "cuxa"],
		["くぃ", "qi", "qwi", "qyi", "kwi", "kuli", "kuxi", "kulyi", "kuxyi", "quli", "quxi", "qulyi", "quxyi", "culi", "cuxi", "culyi", "cuxyi"],
		["くぅ", "qwu", "kwu", "kulu", "kuxu", "qulu", "quxu", "culu", "cuxu"],
		["くぇ", "qe", "qwe", "qye", "kwe", "kule", "kuxe", "kulye", "kuxye", "qule", "quxe", "qulye", "quxye", "cule", "cuxe", "culye", "cuxye"],
		["くぉ", "qo", "qwo", "kwo", "kulo", "kuxo", "qulo", "quxo", "culo", "cuxo"],
		["くゃ", "qya", "kulya", "kuxya", "qulya", "quxya", "culya", "cuxya"],
		["くゅ", "qyu", "kulyu", "kuxyu", "qulyu", "quxyu", "culyu", "cuxyu"],
		["くょ", "qyo", "kulyo", "kuxyo", "qulyo", "quxyo", "culyo", "cuxyo"],
		["あ", "a"],
		["い", "i", "yi"],
		["う", "u", "wu", "whu"],
		["え", "e"],
		["お", "o"],
		["か", "ka", "ca"],
		["き", "ki"],
		["く", "ku", "cu", "qu"],
		["け", "ke"],
		["こ", "ko", "co"],
		["さ", "sa"],
		["し", "si", "ci", "shi"],
		["す", "su"],
		["せ", "se", "ce"],
		["そ", "so"],
		["た", "ta"],
		["ち", "ti", "chi"],
		["つ", "tu", "tsu"],
		["て", "te"],
		["と", "to"],
		["な", "na"],
		["に", "ni"],
		["ぬ", "nu"],
		["ね", "ne"],
		["の", "no"],
		["は", "ha"],
		["ひ", "hi"],
		["ふ", "hu", "fu"],
		["へ", "he"],
		["ほ", "ho"],
		["ま", "ma"],
		["み", "mi"],
		["む", "mu"],
		["め", "me"],
		["も", "mo"],
		["や", "ya"],
		["ゆ", "yu"],
		["よ", "yo"],
		["ら", "ra"],
		["り", "ri"],
		["る", "ru"],
		["れ", "re"],
		["ろ", "ro"],
		["わ", "wa"],
		["を", "wo"],
		["ん", "n", "xn", "n'"],
		["ゔ", "vu"],
		["が", "ga"],
		["ぎ", "gi"],
		["ぐ", "gu"],
		["げ", "ge"],
		["ご", "go"],
		["ざ", "za"],
		["じ", "zi", "ji"],
		["ず", "zu"],
		["ぜ", "ze"],
		["ぞ", "zo"],
		["だ", "da"],
		["ぢ", "di"],
		["づ", "du"],
		["で", "de"],
		["ど", "do"],
		["ば", "ba"],
		["び", "bi"],
		["ぶ", "bu"],
		["べ", "be"],
		["ぼ", "bo"],
		["ぱ", "pa"],
		["ぴ", "pi"],
		["ぷ", "pu"],
		["ぺ", "pe"],
		["ぽ", "po"],
		["ぁ", "xa", "la"],
		["ぃ", "xi", "li", "lyi", "xyi"],
		["ぅ", "xu", "lu"],
		["ぇ", "xe", "le", "lye", "xye"],
		["ぉ", "xo", "lo"],
		["ゃ", "xya", "lya"],
		["ゅ", "xyu", "lyu"],
		["ょ", "xyo", "lyo"],
		["ゎ", "xwa", "lwa"],
		["っ", "xtu", "ltu", "xtsu", "ltsu"],
		["ヵ", "xka", "lka"],
		["ヶ", "xke", "lke"],
		["←", "zh"],
		["↓", "zj"],
		["↑", "zk"],
		["→", "zl"],
		["『", "z["],
		["』", "z]"],
		["ヰ", "wyi"],
		["ゐ", "wyi"],
		["ヱ", "wye"],
		["ゑ", "wye"],
		["ー", "-"],
		["、", ","],
		["。", "."],
		["・", "/" , "z/"],
		["”", "\""],
		["“", "\""],
		["’", "'"],
		["￥", "\\"],
		["「", "["],
		["」", "]"]
	];
}

let ranking_Enter_flag = false; //Enterキーでランキングに登録するフラグ
let bar_base_update_fps = 0
let data_save = ""
let map_style = ""
let speed_Fixed = [0.25,0.5,0.75,1.00,1.25,1.5,1.75,2]
let title_speed
parseLyrics = function (data) {
	document.getElementsByName('space-symbol-omit')[0].checked === true ? kigou_disable = true : kigou_disable = false;
	document.getElementsByName('margin-space-disable')[0].checked === true ? space_disable = true : space_disable = false;
	abridgement_word_length = 0
	data_save = data
	let	array_generator = ""

	typing_array_kana = new Array;
	typing_array_roma = new Array;
	typing_array = new Array;
	lyrics_array = new Array;
	const lines = data.split("\n");
	const lines_length = lines.length
	const romaMap_length = romaMap.length
	const speed_= lines[0].split("\t")[0].match(/^【\d?\.?\d?\d倍速】/)
	if(speed_){
		title_speed = parseFloat(speed_[0].slice(1))
		if(!speed_Fixed.includes(title_speed)){
			title_speed = false
		}
	}
	for (let s=1; s<lines_length; s++){
		a = lines[s].split("\t");

		if(s == 1){
			if(!lyrics_array[0] && +a[0] > 0 ){
				a = ["0", "", ""]
				s--
			}
			map_style = a[1].match(/<style(?: .+?)?>.*?<\/style>/g)
		}

		if(a.length >= 3){
			if(a[2]){
				const symbol_convert = a[2].match(/<ruby(?: .+?)?>.*?<\/ruby>/g)
				if(symbol_convert){
					if(!kigou_disable){
						for(let v = 0;v<symbol_convert.length;v++){
							const start = symbol_convert[v].indexOf(">")+1
							const end = symbol_convert[v].indexOf("<rt>")
							const symbol = symbol_convert[v].slice(start,end)
							a[2] = a[2].replace(symbol_convert[v],symbol)
						}
					}else{
						for(let v = 0;v<symbol_convert.length;v++){
							const start = symbol_convert[v].indexOf("<rt>")+4
							const end = symbol_convert[v].indexOf("</rt>")
							const no_symbol = symbol_convert[v].slice(start,end)
							a[2] = a[2].replace(symbol_convert[v],no_symbol)
						}
					}
				}
			}
		}else{
			a.push("")
		}

		array_generator += a[2].replace(/[ 　]+$/,"").replace(/^[ 　]+/,"")+"\n"
		lyrics_array.push(a);

		if(a[1] == "end" && !movieTotalTime) {
			movieTotalTime = parseInt(a[0]);
			bar_base_update_fps = movieTotalTime/1700
			movie_mm =("00" + parseInt(parseInt(movieTotalTime) / 60)).slice(-2)
			movie_ss = ("00" +(parseInt(movieTotalTime) - movie_mm * 60)).slice(-2)
			var change_bar_base = document.createElement("progress");
			change_bar_base.setAttribute("max", movieTotalTime);
			change_bar_base.setAttribute("value", 0);
			change_bar_base.setAttribute("id", "bar_base");
			change_bar_base.setAttribute("class", "progress");
			document.getElementById("bar_base").parentNode.replaceChild(change_bar_base,document.getElementById("bar_base"));
			SELECTOR_ACCESS_OBJECT['bar_base'] = document.getElementById("bar_base")
			var changebar_input_base = document.createElement("progress");
			changebar_input_base.setAttribute("value", 0);
			changebar_input_base.setAttribute("id", "bar_input_base");
			changebar_input_base.setAttribute("class", "progress");
			document.getElementById("bar_input_base").parentNode.replaceChild(changebar_input_base,document.getElementById("bar_input_base"));
			SELECTOR_ACCESS_OBJECT['bar_input_base'] = document.getElementById("bar_input_base")
			speed = 1
			mode_select = document.querySelector("[name=mode_select]:checked").value
			//Enterキーで行うショートカットキー
			window.addEventListener('keydown', press_start,true);
			break;
		}
	};

	array_generator = array_generator
		.replace(/…/g,"...")
		.replace(/‥/g,"..")
		.replace(/･/g,"・")
		.replace(/〜/g,"～")
		.replace(/｢/g,"「")
		.replace(/｣/g,"」")
		.replace(/､/g,"、")
		.replace(/｡/g,"。")
		.replace(/　/g," ")
		.replace(/ヴ/g,"ゔ")
		.replace(/－/g,"ー")
	for (let i=0; i<romaMap_length; i++){
		if(romaMap[i].length > 1){
			array_generator = array_generator.replace(RegExp(romaMap[i][0],"g"),"\t"+i+"\t");
		}
	};

	array_generator = array_generator.split("\n")

	for(let m=0;m<lyrics_array.length;m++){
		if(array_generator[m] && lyrics_array[m][1] != "end"){
			const arr = hiraganaToRomaArray(array_generator[m]);
			typing_array.push(arr[0]);
			typing_array_kana.push(arr[1]);
			typing_array_roma.push(arr[2]);
		} else {
			typing_array.push([]);
			typing_array_kana.push([]);
			typing_array_roma.push([]);
		}
	}
	return lyrics_array;
}


//typing_array,typing_array_roma,typing_array_kanaの生成
let abridgement_word_length = 0
let zenkaku_list = ["０", "１", "２", "３", "４", "５", "６", "７", "８", "９", "Ａ", "Ｂ", "Ｃ", "Ｄ", "Ｅ", "Ｆ", "Ｇ", "Ｈ", "Ｉ", "Ｊ", "Ｋ", "Ｌ", "Ｍ", "Ｎ", "Ｏ", "Ｐ", "Ｑ", "Ｒ", "Ｓ", "Ｔ", "Ｕ", "Ｖ", "Ｗ", "Ｘ", "Ｙ", "Ｚ", "ａ", "ｂ", "ｃ", "ｄ", "ｅ", "ｆ", "ｇ", "ｈ", "ｉ", "ｊ", "ｋ", "ｌ", "ｍ", "ｎ", "ｏ", "ｐ", "ｑ", "ｒ", "ｓ", "ｔ", "ｕ", "ｖ", "ｗ", "ｘ", "ｙ", "ｚ", "～", "＆", "％", "！", "？", "＠", "＃", "＄", "（", "）", "｜", "｛", "｝", "｀", "＊", "＋", "：", "；", "＿", "＜", "＞", "＝", "＾"]
let sokuon_join = ["ヰ", "ゐ", "ヱ", "ゑ","ぁ", "ぃ", "ぅ", "ぇ", "ぉ","ゃ","ゅ","ょ","っ", "ゎ", "ヵ", "ヶ", "ゔ", "か", "き", "く", "け", "こ", "さ", "し", "す", "せ", "そ", "た", "ち", "つ", "て", "と", "は", "ひ", "ふ", "へ", "ほ", "ま", "み", "む", "め", "も", "や", "ゆ", "よ", "ら", "り", "る", "れ", "ろ", "わ", "を", "が", "ぎ", "ぐ", "げ", "ご", "ざ", "じ", "ず", "ぜ", "ぞ", "だ", "ぢ", "づ", "で", "ど", "ば", "び", "ぶ", "べ", "ぼ", "ぱ", "ぴ", "ぷ", "ぺ", "ぽ"]
let imperfect_sokuon_join = ["い", "う", "ん"]
let imperfect_sokuon_roma_list = ["i","u","n"]
let nn_list = ["あ", "い", "う", "え", "お", "な", "に", "ぬ", "ね", "の", "や", "ゆ", "よ", "ん", "'", "’"]
let symbol_disable_list = ["!","?",",","\"","'","^","|","[","]","(",")","`",":",";","<",">","_","~","{","}"]
let symbol_disable_romamap_list = [",",".","/","\"","'","[","]","z[","z]"]
let valid_symbol = ["#","$","%","&","\~","=","*","+","@","\\"," "]
let symbol_list = symbol_disable_romamap_list.concat(symbol_disable_list,valid_symbol)
let symbol_count = {};
hiraganaToRomaArray = function (str) {

	var str_array = [];
	var kana_array = [];
	var roma_array = [];
	str = str.split("\t").filter(word => word > "")
	const str_length = str.length

	for (let i=0; i<str_length; i++){
		if(romaMap[parseInt(str[i])]){
			kana_array.push(romaMap[parseInt(str[i])][0]);
			str_array.push(romaMap[parseInt(str[i])].slice(1));
			roma_array.push(romaMap[parseInt(str[i])][1]);
			//促音の打鍵パターン
			if(kana_array.length >= 2 && kana_array[kana_array.length-2][kana_array[kana_array.length-2].length-1]=="っ"){
				if(sokuon_join.includes(kana_array[kana_array.length-1][0])){
					const xtu_times = ( kana_array[kana_array.length-2].match( /っ/g ) || [] ).length

					kana_array[kana_array.length-1] = kana_array[kana_array.length-2] + kana_array[kana_array.length-1]
					kana_array.splice(-2,1)
					const length = str_array[str_array.length-1].length
					let repeat = []
					let xtu = []
					let ltu = []
					let xtsu = []
					let ltsu = []
					for(let s = 0;s<length;s++){
						repeat.push(str_array[str_array.length-1][s][0].repeat(xtu_times)+str_array[str_array.length-1][s])
						xtu.push("x".repeat(xtu_times)+"tu"+str_array[str_array.length-1][s])
						ltu.push("l".repeat(xtu_times)+"tu"+str_array[str_array.length-1][s])
						xtsu.push("x".repeat(xtu_times)+"tsu"+str_array[str_array.length-1][s])
						ltsu.push("l".repeat(xtu_times)+"tsu"+str_array[str_array.length-1][s])
					}

					str_array[str_array.length-1] = [...repeat,...xtu,...ltu,...xtsu,...ltsu]
					str_array.splice(-2,1)

					roma_array[roma_array.length-1] = str_array[str_array.length-1][0]
					roma_array.splice(-2,1)
				}else if(imperfect_sokuon_join.includes(kana_array[kana_array.length-1][0])){
					const xtu_times = ( kana_array[kana_array.length-2].match( /っ/g ) || [] ).length

					kana_array[kana_array.length-1] = kana_array[kana_array.length-2] + kana_array[kana_array.length-1]
					kana_array.splice(-2,1)

					const length = str_array[str_array.length-1].length
					let repeat = []
					let xtu = []
					let ltu = []
					let xtsu = []
					let ltsu = []
					for(let s = 0;s<length;s++){
						if(!imperfect_sokuon_roma_list.includes(str_array[str_array.length-1][s][0])){
							repeat.push(str_array[str_array.length-1][s][0].repeat(xtu_times)+str_array[str_array.length-1][s])
						}
						xtu.push("x".repeat(xtu_times)+"tu"+str_array[str_array.length-1][s])
						ltu.push("l".repeat(xtu_times)+"tu"+str_array[str_array.length-1][s])
						xtsu.push("x".repeat(xtu_times)+"tsu"+str_array[str_array.length-1][s])
						ltsu.push("l".repeat(xtu_times)+"tsu"+str_array[str_array.length-1][s])
					}

					str_array[str_array.length-1] = [...repeat,...xtu,...ltu,...xtsu,...ltsu]
					str_array.splice(-2,1)

					roma_array[roma_array.length-1] = str_array[str_array.length-1][0]
					roma_array.splice(-2,1)
				}
			}

			if(kigou_disable && symbol_disable_romamap_list.includes(roma_array[roma_array.length-1])){
				if(!space_disable && kana_array.length >= 2 && kana_array[kana_array.length-1] == "・"){
					kana_array[kana_array.length-2] += " "
					roma_array[roma_array.length-2] += " "
				}
				kana_array.pop()
				str_array.pop()
				roma_array.pop()
				abridgement_word_length ++
			}


			//n→nn変換
			const n_kana_check = kana_array[kana_array.length-2]
			if(n_kana_check && n_kana_check[n_kana_check.length-1]=="ん"){
				if(nn_list.includes(kana_array[kana_array.length-1][0])){
					for(let n=0;n<str_array[str_array.length-2].length;n++){
						const str_pattern = str_array[str_array.length-2][n]
						if((str_pattern.length >= 2 && str_pattern[str_pattern.length-2] != "x" && str_pattern[str_pattern.length-1] == "n") || str_pattern=="n"){
							str_array[str_array.length-2][n] = str_array[str_array.length-2][n]+"n"
						}
					}
					roma_array[roma_array.length-2] = str_array[str_array.length-2][0]
					//それ以外の文字でもnnの入力を可能にする
				}else if(kana_array[kana_array.length-1]){
					const array_length = str_array[str_array.length-1].length
					for (let i=0; i<array_length; i++){
						str_array[str_array.length-1].push("n"+str_array[str_array.length-1][i])
						str_array[str_array.length-1].push("'"+str_array[str_array.length-1][i])
					}
				}
			}
			const symbolEncount = symbol_list.indexOf(roma_array[roma_array.length-1])
			if(symbolEncount > -1){
				if(symbol_count[kana_array[kana_array.length-1]]){
					symbol_count[kana_array[kana_array.length-1]]++
				}else{
					symbol_count[kana_array[kana_array.length-1]] = 1
				}
			}

		} else{

			//打鍵パターン生成を行わなくて良い文字はそのままtyping_arrayに追加
			for (let v=0; v<str[i].length; v++){
				kana_array.push( str[i][v] );
				let typing_character = str[i][v]
				if(zenkaku_list.includes(str[i][v])){
					typing_character = String.fromCharCode(typing_character.charCodeAt(0) - 0xFEE0);
				}
				roma_array.push(typing_character);
				if(/[A-Z]/.test(typing_character) ){
					typing_character = typing_character.toLowerCase()
				}
				str_array.push( [typing_character] );


				if(kigou_disable){
					//半角スペース無効設定有効で半角スペースを除去。
					if(kana_array[kana_array.length-1] == " "){
						if(kana_array.length >= 2 && !space_disable){
							kana_array[kana_array.length-2] += " "
							roma_array[roma_array.length-2] += " "
						}
						kana_array.pop()
						str_array.pop()
						roma_array.pop()
						abridgement_word_length ++
					}
					if(kana_array[kana_array.length-1]=="～"){
						kana_array[kana_array.length-1]="ー"
						roma_array.splice(-1,1,'-')
						str_array[str_array.length-1][0] = '-'
					}
					if(symbol_disable_list.includes(roma_array[roma_array.length-1])){
						kana_array.pop()
						str_array.pop()
						roma_array.pop()
						abridgement_word_length ++
					}else if(kana_array[kana_array.length-1] == "-" && (kana_array.length >= 2 && /[a-zA-Zａ-ｚＡ-Ｚ\s]/.test(kana_array[kana_array.length-2]) || kana_array.length == 1)){
						if(kana_array.length >= 2 && !space_disable){
							kana_array[kana_array.length-2] += " "
							roma_array[roma_array.length-2] += " "
						}
						kana_array.pop()
						str_array.pop()
						roma_array.pop()
						abridgement_word_length ++
					}else if(kana_array[kana_array.length-1] == "."&&(kana_array.length >= 2 && !/[0-9０-９]/.test(kana_array[kana_array.length-2])||kana_array.length == 1)){
						kana_array.pop()
						str_array.pop()
						roma_array.pop()
						abridgement_word_length ++
					}
				}


				//n→nn変換
				if(v == 0){

					//ん
					const n_kana_check = kana_array[kana_array.length-2]
					//「アルファベット シングルクォート」の [n] 非対応の文字がkana_arrayに追加されたとき、 [n]→[nn] に置き換えます。
					if(n_kana_check && n_kana_check[n_kana_check.length-1]=="ん"){
						if(/[a-zA-Zａ-ｚＡ-Ｚ]/.test(kana_array[kana_array.length-1])||nn_list.includes(kana_array[kana_array.length-1][0])){
							for(let n=0;n<str_array[str_array.length-2].length;n++){
								const str_pattern = str_array[str_array.length-2][n]
								if((str_pattern.length >= 2 && str_pattern[str_pattern.length-2] != "x" && str_pattern[str_pattern.length-1] == "n") || str_pattern=="n"){
									str_array[str_array.length-2][n] = str_array[str_array.length-2][n]+"n"
								}
							}
							roma_array[roma_array.length-2] = str_array[str_array.length-2][0]
							//それ以外の文字でもnnの入力を可能にする
						}else if(kana_array[kana_array.length-1]){
							const array_length = str_array[str_array.length-1].length
							for (let i=0; i<array_length; i++){
								str_array[str_array.length-1].push("n"+str_array[str_array.length-1][i])
								str_array[str_array.length-1].push("'"+str_array[str_array.length-1][i])
							}
						}
					}
				}
				const symbolEncount = symbol_list.indexOf(roma_array[roma_array.length-1])
				if(symbolEncount > -1){
					if(symbol_count[kana_array[kana_array.length-1]]){
						symbol_count[kana_array[kana_array.length-1]]++
					}else{
						symbol_count[kana_array[kana_array.length-1]] = 1
					}
				}

			}
		}

	};

	//kana_array最後の文字が「ん」だった場合も[nn]に置き換えます。
	if(kana_array[kana_array.length-1] == "ん"){
		roma_array.splice(-1,1,'nn')
		str_array[str_array.length-1][0] = 'nn'
		str_array[str_array.length-1].push("n'")
	}
	return [str_array, kana_array, roma_array];
}




var total_notes=0;
var line_length=0;

var total_notes_roma_mode = 0;
var total_notes_kana_mode = 0;
var kana_notes_list = []
var roma_notes_list = []

let median_roma_speed = 0
let median_kana_speed = 0
let max_roma_speed = 0
let max_kana_speed = 0

var line_difficulty_data_roma=[];//打鍵速度が早い順で[ライン番号,ライン打鍵数,ラインの必要打鍵速度]が入る
var line_difficulty_data_kana=[];//打鍵速度が早い順で[ライン番号,ライン打鍵数,ラインの必要打鍵速度]が入る

var logcount_save = 0
let logcount = 0 //typinglogのラインカウント確認
let combo_challenge_html

let speed_background = "transparent"
let speed_color = "rgba(255,255,255,.85)"
//配点基準・必要速度を計算・表示
getScorePerChar=function () {

	//TypingLog(詳細記録)
	latency_kpm_rkpm_log = Array(lyrics_array.length-1).fill([0,0,0]); //[反応時間,打鍵速度,初速抜き打鍵速度]
	clear_time_log = Array(lyrics_array.length-1).fill(0); //[ライン毎の入力経過時間]
	escape_word_length_log = Array(lyrics_array.length-1).fill(["",0,0]); //[逃した文字,文字数, completeしてたら1。それ以外は0。]
	line_score_log = Array(lyrics_array.length-1).fill([0,0]); //[そのラインで獲得したスコア]
	line_typing_count_miss_count_log = Array(lyrics_array.length-1).fill([0,0,0]); //[打鍵数,ミス打鍵数,コンボ]
	line_typinglog_log = Array(lyrics_array.length-1).fill([]);//line_typinglogのlog。[line_typinglog.push([c , 1 , headtime+practice_time , kana_mode]);


	total_notes_kana_mode = 0
	total_notes_roma_mode = 0
	kana_notes_list = []
	roma_notes_list = []
	line_difficulty_data_roma = []
	line_difficulty_data_kana = []
	line_length = 0;

	const typing_array_length = typing_array.length
	for (let i=0; i<typing_array_length; i++){
		let line_notes_roma=0
		let line_notes_kana=0
		let line_daku_handaku=0
		let line_speed = 0
		//typing_arrayのi番号がend行と同じ番号なら総合打鍵数に含まない
		if(lyrics_array[i][1]!='end' && typing_array[i] != ''){
			line_length++;
			if(logcount == 0){
				logcount = i+1
				logcount_save = i+1
			}
			line_speed = lyrics_array[i+1][0]-lyrics_array[i][0]

			//かな入力
			line_daku_handaku=(typing_array_kana[i].join('').match( /[ゔ|が|ぎ|ぐ|げ|ご|ざ|じ|ず|ぜ|ぞ|だ|ぢ|づ|で|ど|ば|び|ぶ|べ|ぼ|ぱ|ぴ|ぷ|ぺ|ぽ]/g ) || [] ).length
			line_notes_kana=typing_array_kana[i].join('').replace(/ /g,"").length
			total_notes_kana_mode += (line_notes_kana+line_daku_handaku)

			//ローマ字入力
			line_notes_roma = typing_array_roma[i].join('').replace(/ /g,"").length
			total_notes_roma_mode += line_notes_roma






		}else if(lyrics_array[i][1]=='end'){

			median_roma_speed = median(line_difficulty_data_roma);
			median_kana_speed = median(line_difficulty_data_kana);
			max_roma_speed = Math.max(...line_difficulty_data_roma)
			max_kana_speed = Math.max(...line_difficulty_data_kana)

			score_per_char = 200000 / (total_notes_roma_mode + abridgement_word_length)

			if(title_speed){
				speed = title_speed
				play_speed = title_speed;
				document.getElementById("playspeed").textContent = play_speed.toFixed(2)+"倍速"
				document.getElementById("speed").textContent = play_speed.toFixed(2)+"倍速"
				if(play_mode == "normal"){
					if(play_speed == 2){
						speed_background = "#ed143d99"
						speed_color = "ghostwhite"
					}else if(play_speed == 1.75){
						speed_background = "#9370dba9"
						speed_color = "ghostwhite"
					}else if(play_speed == 1.5){
						speed_background = "#00ff7f7a"
						speed_color = "#FFF"
					}else if(play_speed == 1.25){
						speed_background = "#4ed6ff73"
					}else if(play_speed == 1){
						speed_background = "transparent"
					}
					document.getElementById("speed").setAttribute("style", `
    color:`+speed_color+`;
    background:`+speed_background+`;`);
				}
				time_conversion(speed)
			}
			map_info_generator()
			break;
		}

		kana_notes_list.push(line_notes_kana+line_daku_handaku)
		roma_notes_list.push(line_notes_roma)
		line_difficulty_data_roma.push(line_speed > 0 ? Math.round((line_notes_roma/line_speed) * 100) / 100 : 0)
		line_difficulty_data_kana.push(line_speed > 0 ? Math.round(((line_notes_kana+line_daku_handaku)/line_speed) * 100) / 100 : 0)

	};
	return score_per_char;
}

function redo_parseLyrics(){
	if(document.getElementsByName('space-symbol-omit')[0].checked === true){
		parseLyrics(data_save);
		score_per_char = getScorePerChar()
		document.getElementById("space-trace").style.display = "inline";
	}else{
		document.getElementById("space-trace").style.display = "none";
	}
}

document.getElementsByName('space-symbol-omit')[0].addEventListener("change",redo_parseLyrics)
document.getElementsByName('margin-space-disable')[0].addEventListener("change",redo_parseLyrics)

var median = function(arr) {
	arr = arr.filter(function(a) {return a !== 0;})
	var half = (arr.length/2)|0;
	var temp = arr.sort((a, b) => a - b);

	if (temp.length%2) {
		return temp[half];
	}

	return (temp[half-1] + temp[half])/2;
};





/*
*@ページ読み込み時のタイピングワード生成処理 ここまで---
**/
/////////////////////////////////////////////////////////////////////////////////////////////////











/////////////////////////////////////////////////////////////////////////////////////////////////
/**
*@プレイ開始前準備の関数変更 ここから---
*/

const SELECTOR_ACCESS_OBJECT = {}


//statusを構成する要素追加
update_status = function(){
	CorrectCalc()
	if(OPTION_ACCESS_OBJECT['status-mode']){
		document.getElementById("status").style.height = "209px"
		if(OPTION_ACCESS_OBJECT['miss-limit-mode'] || document.getElementsByName('visibility-correct')[0].checked){
			document.getElementById("status").style.lineHeight = "38.6px"
		}else{
		document.getElementById("status").style.lineHeight = "42.4px"
		}
		document.getElementById("status").style.fontSize = "1.4rem"
		const LINE_COUNT = `<span id="line-count-value">${line_length-(failer_count+complete_count)}</span><span style='margin-left: 8px;font-size:90%;'>`

		document.getElementById("status").innerHTML =
`<div class='flex_space_between'><span class='score_counter' id='score-value'>${(score/2000).toFixed(2)}</span><span class='rank' style="${ranking_array.length ? "" : "display:none;"}opacity:0.4;font-size:90%;"><span id='rank-value'>${now_rank+1}</span><span class="status_name"'>位</span></span></div>
<div class="status_border"></div>

<div id="miss_area">
<div id='miss_life'>
<span><span id='miss-value'>${typing_miss_count}</span><span class="status_name">miss</span></span></span>
${OPTION_ACCESS_OBJECT['miss-limit-mode'] && !OPTION_ACCESS_OBJECT['miss-limit-game-mode'] ? `<span id="life"><span id='life-value'>`+life_correct.toFixed(1)+`</span><span class="status_name">life</span></span>`:""}
</div>
<div class='correct_sub' style='display:${OPTION_ACCESS_OBJECT['miss-limit-mode'] || document.getElementsByName('visibility-correct')[0].checked ? "block;":"none;"}${OPTION_ACCESS_OBJECT['miss-limit-mode'] && OPTION_ACCESS_OBJECT['miss-limit-game-mode'] ? "color:gold;":""}'><span style='font-size:75%;font-weight:normal;'>正確率:</span><span id='correct_text' style='font-size:85%;'><span id='correct-value'>${correct}</span>%
${ (OPTION_ACCESS_OBJECT['miss-limit-mode'] ? `<span id='keep' style="padding-left:9px;"><span id='keep-value'>${keep_correct.toFixed(1)}</span>%</span>` : "")}</span></div>
</div>

<div class="status_border"></div>
<div style="font-size:85%;"><span class='type-counter'><span id='typing-count-value'>${typing_count}</span><span class="status_name">打</span></span><span class='escape-counter'> / <span id='escape-value'>${escape_word_length}</span><span class="status_name">逃し</span></span></div>
<div class="status_border"></div>
<div class='typing_speed' style="font-size:85%;"><span id='type-speed'>${typing_speed.toFixed(2)}</span><span class="status_name">打/秒</span></div>
<div class="status_border"></div>
<div class='remaining-line-counter' style="${play_mode == 'normal' ? "opacity:0.5;font-size:85%;" : "font-size:85%;"}"> ${ play_mode == 'normal' ? `<span style="font-weight: 100;margin-right: 5.5px;font-size:90%;">残り</span>${LINE_COUNT}line`:`${LINE_COUNT}line failed`}</span></div>
`;
	}else{
		document.getElementById("status").style.height = "initial"
		document.getElementById("status").style.lineHeight = "30px"
		document.getElementById("status").style.fontSize = "1.5rem"
		document.getElementById("status").innerHTML = `
<table style="width:100%;table-layout: fixed;position: relative;right: -82px;">
<tr id=statu1dan style='height: 4rem;'>

<td class='score_counter'><span class='status_label' style="left: -48px;">Score</span>
<span class="flex_status_position"><span id='score-value'>`+(score/2000).toFixed(2)+`</span><span class="flex_status_border"></span></span>
</td>

<td class='miss' id='miss_life'><span class='status_label' >Miss</span>
`+(OPTION_ACCESS_OBJECT['miss-limit-mode'] && !OPTION_ACCESS_OBJECT['miss-limit-game-mode'] ? `<span id="life" style="position: absolute;left: -48px;line-height: 10px;top: -2px;"><span id='life-value'>`+life_correct.toFixed(1)+`</span></span>`:"")+`

<span class="flex_status_position"><span id='miss-value'>`+typing_miss_count+`</span><span class="flex_status_border"></span></span>
</td>

<td class='escape-counter'><span class='status_label'>Lost</span>
<span class="flex_status_position"><span id='escape-value'>`+escape_word_length + `</span><span class="flex_status_border"></span></span>
</td>

<td class='typing_speed'><span class='status_label' style='font-weight:normal;left: -42px;'>打/秒</span>
<span class="flex_status_position"><span id='type-speed'>`+typing_speed.toFixed(2)+`</span><span class="flex_status_border"></span></span>
</td>
</tr>

<tr id=statu2dan style='height: 4rem;'>
<td class='rank'><span class='status_label' style="left: -45px;">Rank</span>
<span class="flex_status_position"><span id='rank-value'>`+ (now_rank+1) + `</span><span style='font-weight:normal;'>位</span><span class="flex_status_border"></span></span>
</td>


<td class='correct' style='visibility:`+(OPTION_ACCESS_OBJECT['miss-limit-mode'] || document.getElementsByName('visibility-correct')[0].checked ? "visible":"hidden")+`;'><span class='status_label' style='font-size:65%;font-weight:normal;left: -45px;'>正確率</span>
<span id="keep" style="display:`+(OPTION_ACCESS_OBJECT['miss-limit-mode'] ? "block":"none")+`;`+(OPTION_ACCESS_OBJECT['miss-limit-mode'] && OPTION_ACCESS_OBJECT['miss-limit-game-mode'] ? "color:gold;":"opacity: 0.6;")+`padding-left:9px;position: absolute;left: -53px;line-height: 10px;top: 0;"><span id="keep-value">`+(OPTION_ACCESS_OBJECT['miss-limit-mode'] ? keep_correct.toFixed(1) :"")+`</span>%</span>
<span class="flex_status_position"><span style='font-size:90%;'><span id='correct-value'>`+correct+`</span>%</span><span class="flex_status_border"></span></span>
</td>

<td class='type-counter'><span class='status_label' style='left: -43px;'>Type</span>
<span class="flex_status_position"><span id='typing-count-value'>`+typing_count + `</span><span class="flex_status_border"></span></span>
</td>

<td class='remaining-line-counter'><span class='status_label' ><span id='normal_line_change'>${play_mode == 'normal' ? "Line":"Faile"}</span></span>
<span class="flex_status_position"><span id='line-count-value'>` +(line_length-(failer_count+complete_count))+`</span><span class="flex_status_border"></span></span>
</td>
</tr>
</table>`;
	}
	SELECTOR_ACCESS_OBJECT['life-value'] = OPTION_ACCESS_OBJECT['miss-limit-mode'] && !OPTION_ACCESS_OBJECT['miss-limit-game-mode'] ? document.getElementById("life-value") : undefined
	SELECTOR_ACCESS_OBJECT['score-value'] = document.getElementById("score-value")
	SELECTOR_ACCESS_OBJECT['miss-value'] = document.getElementById("miss-value")
	SELECTOR_ACCESS_OBJECT['typing-count-value'] = document.getElementById("typing-count-value")
	SELECTOR_ACCESS_OBJECT['escape-value'] = document.getElementById("escape-value")
	SELECTOR_ACCESS_OBJECT['keep-value'] = document.getElementById("keep-value")
	SELECTOR_ACCESS_OBJECT['correct-value'] = document.getElementById("correct-value")
	SELECTOR_ACCESS_OBJECT['rank-value'] = document.getElementById("rank-value")
	SELECTOR_ACCESS_OBJECT['line-count-value'] = document.getElementById("line-count-value")
	SELECTOR_ACCESS_OBJECT['type-speed'] = document.getElementById("type-speed")

	if(!document.getElementsByName('visibility-score')[0].checked){
		document.getElementsByClassName('score_counter')[0].style.visibility = "hidden"
	}

	if(!document.getElementsByName('visibility-rank')[0].checked){
		document.getElementsByClassName('rank')[0].style.visibility = "hidden"
	}

	if(!document.getElementsByName('visibility-miss')[0].checked){
		document.getElementById('miss_life').style.visibility = "hidden"
	}

	if(!document.getElementsByName('visibility-type-counter')[0].checked){
		document.getElementsByClassName('type-counter')[0].style.visibility = "hidden"
	}

	if(!document.getElementsByName('visibility-escape-counter')[0].checked){
		document.getElementsByClassName('escape-counter')[0].style.visibility = "hidden"
	}

	if(!document.getElementsByName('visibility-typing-speed')[0].checked){
		document.getElementsByClassName('typing-speed')[0].style.visibility = "hidden"
	}

	if(!document.getElementsByName('visibility-remaining-line-counter')[0].checked){
		document.getElementsByClassName('remaining-line-counter')[0].style.visibility = "hidden"
	}


}


let control_default_size
let complete_html_save
let DefaultPlaySpeed = 0

var speedbutton
let combo_challenge
let combo_challenge_beatmap_data
let play_ID
let play_Name

var flick_form = document.createElement('input');
flick_form.setAttribute("id", "flick-input");
var flick_form_second = document.createElement('input');
flick_form_second.setAttribute("id", "flick-input-second");

function starting_kashi_area(){
	document.getElementById("kashi_area").style.display = "block"
	document.getElementById("esckey").style.display= 'none';
	document.getElementById("mode-select-area").style.display = "none"
}
function view_shortcut_key(){
	if(document.getElementById("shortcut").style.display == "none"){
		document.getElementById("shortcut").style.display = "block";
		document.getElementById("shortcut").animate([{opacity: '0'}, {opacity: '1'}], 100)
	}else{
		document.getElementById("shortcut").style.display = "none";
	}
}


function speed_change(){
	if(!is_played){
		if(play_speed != 2){
			play_speed_up()
		}else{
			speed = 1
			play_speed = 1;
			player.setPlaybackRate(1);
			speed_background = "transparent"
			speed_color = "#FFF"
			document.getElementById("playspeed").textContent = speed.toFixed(2)+"倍速"
			document.getElementById("speed").textContent = play_speed.toFixed(2)+"倍速"
			document.getElementById("speed").setAttribute("style", `
    color:#FFF;
    background:transparent;`);
		}
		time_conversion(speed)
	}else{
		speedup()
		if(PHONE_FLAG){
			player.seekTo(player.getCurrentTime())
		}
		play_focus()
	}
}


//プレイ開始時に各機能で必要なDOMを追加
function play_preparation(){
	OPTION_ACCESS_OBJECT['typing-effect-volume'] = document.getElementsByName('typing-effect-volume')[0].value/100
	OPTION_ACCESS_OBJECT['miss-effect-volume'] = document.getElementsByName('miss-effect-volume')[0].value/100
	OPTION_ACCESS_OBJECT['line-clear-effect-volume'] = document.getElementsByName('line-clear-effect-volume')[0].value/100
	OPTION_ACCESS_OBJECT['combo-break-effect-volume'] = document.getElementsByName('combo-break-effect-volume')[0].value/100
	OPTION_ACCESS_OBJECT['gameover-effect-volume'] = document.getElementsByName('gameover-effect-volume')[0].value/100


	const tooltip = document.querySelector('[role="tooltip"]')
	if(tooltip != null){
		tooltip.remove()
	}
	player.setPlaybackRate(play_speed);

	//ランキングのスコア取得
	for (let i = 0;i<ranking_length.length; i++) {ranking_array.push(parseFloat(ranking_length[i].textContent))};
	ranking_array = ranking_array.slice(ranking_array.lastIndexOf(ranking_array.find(element => element > 0)))

	if(!kana_mode){
		notes_list = roma_notes_list
		line_difficulty_data = line_difficulty_data_roma
		total_notes = total_notes_roma_mode
	}else{
		notes_list = kana_notes_list
		line_difficulty_data = line_difficulty_data_kana
		total_notes = total_notes_kana_mode
	}

	if(localStorage.getItem('challenge-enable') != "false" && play_mode == "normal"){
		combo_challenge_beatmap_data = localStorage.getItem("combo_challenge_beatmap_data") ? JSON.parse(localStorage.getItem("combo_challenge_beatmap_data")) : [];
		combo_challenge = true
		play_ID = location.href.match(/[0-9]+\.?[0-9]*/)[0]
		play_Name = document.querySelector(".movietitle h1").textContent
	}
	document.getElementById("time_settings").style.visibility = "visible"
	if(document.getElementById("time_settings2") != null){
		document.getElementById("time_settings2").style.visibility = "visible"
	}
	if(PHONE_FLAG){
		const shortcut_key_div = document.querySelectorAll("#shortcut > div")
		for(let i=0;i<shortcut_key_div.length;i++){
			shortcut_key_div[i].style.flexDirection = "column"
		}
	}
	if(document.getElementById("song_reset") != null){
		document.getElementById("song_reset").addEventListener("click",{name:"touch_restart", handleEvent:song_reset})
		document.getElementById("song_reset_F4").addEventListener("mouseover",function restart_underline(event){
			document.getElementById("restart").style.textDecoration = "underline"
		})
		document.getElementById("song_reset_F4").addEventListener("mouseout",function restart_underline_delete(event){
			document.getElementById("restart").style.textDecoration = ""
		})
		document.getElementById("speed_change_F10").addEventListener("mouseover",function restart_underline(event){
			document.getElementById("speed").style.textDecoration = "underline"
		})
		document.getElementById("speed_change_F10").addEventListener("mouseout",function restart_underline_delete(event){
			document.getElementById("speed").style.textDecoration = ""
		})

	}
	document.getElementById("speed_change").addEventListener("click",speed_change)
	document.getElementById("more_shortcutkey").addEventListener("click",view_shortcut_key)

	if(document.getElementById("combo_challenge") != null){
		document.getElementsByName('challenge-enable')[0].setAttribute("disabled","disabled")
	}
	document.getElementsByName('space-symbol-omit')[0].setAttribute("disabled","disabled")
	document.getElementsByName('margin-space-disable')[0].setAttribute("disabled","disabled")

	if(map_style != null){document.head.insertAdjacentHTML('beforeend',map_style[0]);}//譜面styleを適用


	document.querySelector("[onclick='play_speed_down()']").innerHTML = `<div style="position:relative;">-<span style="position: absolute;top: -0.8em;left: 50%;transform: translateX(-50%);-webkit-transform: translateX(-50%);-ms-transform: translateX(-50%);font-size:90%;">F9</span></div>`
	document.querySelector("[onclick='play_speed_up()']").innerHTML = `<div style="position:relative;">+<span style="position: absolute;top: -0.8em;left: 50%;transform: translateX(-50%);-webkit-transform: translateX(-50%);-ms-transform: translateX(-50%);font-size:84%;">F10</span></div>`
	speedbutton = document.getElementById("playBotton3").cloneNode(true)

	function resize_adjust(){
		if(!finished&&document.getElementsByName('play-scroll')[0].checked&&!navigator.userAgent.match(/(iPhone|iPod|iPad|Android.*Mobile)/i)){
			auto_scroll_flag = true
			window.scrollTo({top: (document.documentElement.scrollTop+CONTROLBOX_SELECTOR.getBoundingClientRect().top+CONTROLBOX_SELECTOR.clientHeight+Number(document.getElementsByName('scroll-adjustment')[0].selectedOptions[0].value)-document.documentElement.clientHeight)})
		}
	}
	window.addEventListener('resize',resize_adjust);

	SELECTOR_ACCESS_OBJECT['kashi'] = document.getElementById("kashi")
	SELECTOR_ACCESS_OBJECT['kashi_next'] = document.getElementById("kashi_next")
	SELECTOR_ACCESS_OBJECT['kashi_roma'] = document.getElementById("kashi_roma")
	SELECTOR_ACCESS_OBJECT['header'] = document.getElementsByTagName('header')[0]
	if(keyboard == "mac"){
		document.getElementById("song_reset_F4").style.visibility = "hidden"
		document.getElementById("speed_change_F10").style.visibility = "hidden"
		document.getElementById("more_shortcutkey").style.display = "none"
		if(!SELECTOR_ACCESS_OBJECT['flick-input']){
			create_flick_textbox()
		}
		const cover_width = getComputedStyle( document.getElementById("player"), null ) .getPropertyValue( "max-width" ) != "none" ? getComputedStyle( document.getElementById("player"), null ) .getPropertyValue( "max-width" ) : getComputedStyle( document.getElementById("player"), null ) .getPropertyValue( "width" )
		const cover_height = getComputedStyle( document.getElementById("player"), null ) .getPropertyValue( "max-height" ) != "none" ? getComputedStyle( document.getElementById("player"), null ) .getPropertyValue( "max-height" ) : getComputedStyle( document.getElementById("player"), null ) .getPropertyValue( "height" )

		document.getElementById("player").insertAdjacentHTML('beforebegin',`<span id="flick_pause_cover" style="
     width: `+cover_width+`;
     height: `+cover_height+`;
     position: absolute;
     background:transparent;
     display:none;
     z-index:10;
"></span>`)
		document.getElementById("flick_pause_cover").addEventListener("click",function(){
			player.playVideo()
			play_focus()
		})
	}
	document.querySelector(".status .nav").children[0].classList.add('underline');
	document.querySelector(".status .nav").children[1].classList.remove('underline');
	SELECTOR_ACCESS_OBJECT['kashi'].classList.add('lyric_space');
	SELECTOR_ACCESS_OBJECT['kashi_next'].classList.add('lyric_space');
	SELECTOR_ACCESS_OBJECT['kashi'].classList.remove('text-white');
	SELECTOR_ACCESS_OBJECT['kashi'].classList.remove('mt-3');
	SELECTOR_ACCESS_OBJECT['kashi_next'].classList.remove('mt-3');
	SELECTOR_ACCESS_OBJECT['kashi_next'].classList.remove('text-muted');


	var skip_guide_total_time_html = document.createElement('div');
	skip_guide_total_time_html.setAttribute("id", "skip_guide_total_time");
	skip_guide_total_time_html.setAttribute("class", "bar_text");
	skip_guide_total_time_html.innerHTML = `<div id="skip-guide"></div><div id="total-time">00:00 / `+movie_mm+`:`+movie_ss+`</div>`
	SELECTOR_ACCESS_OBJECT['kashi_next'].parentNode.insertBefore(skip_guide_total_time_html, SELECTOR_ACCESS_OBJECT['kashi_next'].nextElementSibling);
	SELECTOR_ACCESS_OBJECT['skip-guide'] = document.getElementById("skip-guide")
	if(keyboard == "mac"){
		document.getElementById("kashi_area").addEventListener("click",press_skip,false)
	}else{
		SELECTOR_ACCESS_OBJECT['skip-guide'].addEventListener("click",press_skip,false)
	}
	SELECTOR_ACCESS_OBJECT['total-time'] = document.getElementById("total-time")


	var next_kpm_html = document.createElement('div');
	next_kpm_html.setAttribute("id", "next-kpm");
	next_kpm_html.setAttribute("style", "font-size:12.5px;font-weight: 500;text-align:left;");
	next_kpm_html.innerHTML = "&#8203;"
	SELECTOR_ACCESS_OBJECT['kashi_next'].parentNode.insertBefore(next_kpm_html, SELECTOR_ACCESS_OBJECT['kashi_next'].nextElementSibling);
	SELECTOR_ACCESS_OBJECT['next-kpm'] = document.getElementById("next-kpm")


	const remaining_time_create_html = "<span id='line-speed'>0.00打/秒</span> - <span id='remaining-time'>残り0.0秒</span>"
	var top_text_html = document.createElement('div');
	top_text_html.setAttribute("id", "top_flex_box");
	top_text_html.setAttribute("class", "bar_text");
	top_text_html.setAttribute("style", "font-family: sans-serif;font-weight: 600;");
	top_text_html.innerHTML = `<div id="combo-value" class="combo-counter-effect-color"></div>
<div id="complete_effect" class="combo-counter-effect-color"></div>
<div id="line_remaining_time">`+remaining_time_create_html+`</div>`
	document.getElementById("bar_input_base").parentNode.insertBefore(top_text_html, document.getElementById("bar_input_base"));
	SELECTOR_ACCESS_OBJECT['combo-value'] = document.getElementById("combo-value")
	SELECTOR_ACCESS_OBJECT['remaining-time'] = document.getElementById("remaining-time")
	SELECTOR_ACCESS_OBJECT['line-speed'] = document.getElementById("line-speed")
	var complete_html = document.createElement("div");
	complete_html.setAttribute("id", "complete_effect");
	complete_html.setAttribute("class", "combo-counter-effect-color");
	complete_html_save = complete_html.cloneNode(true)

	var count_anime_html = document.createElement('div');
	count_anime_html.setAttribute("id", "count-anime");
	SELECTOR_ACCESS_OBJECT['kashi'].parentNode.insertBefore(count_anime_html, SELECTOR_ACCESS_OBJECT['kashi']);
	SELECTOR_ACCESS_OBJECT['count-anime'] = document.getElementById("count-anime")

	document.getElementById("bar_input_base").style.marginTop = "0";
	document.getElementById("bar_base").style.marginTop = "0";
	SELECTOR_ACCESS_OBJECT['kashi'].style.color=document.getElementsByName('lyric-color')[0].value;
	SELECTOR_ACCESS_OBJECT['kashi_next'].style.marginBottom="0";
	SELECTOR_ACCESS_OBJECT['kashi_next'].style.color=document.getElementsByName('next-lyric-color')[0].value;


	var kashi_roma_html = document.createElement('div');
	kashi_roma_html.setAttribute("id", "kashi_sub");
	kashi_roma_html.setAttribute("style", "font-weight:600;");
	kashi_roma_html.innerHTML = "&#8203;"
	SELECTOR_ACCESS_OBJECT['kashi_roma'].parentNode.insertBefore(kashi_roma_html, SELECTOR_ACCESS_OBJECT['kashi_roma'].nextElementSibling);
	SELECTOR_ACCESS_OBJECT['kashi_sub'] = document.getElementById("kashi_sub")
	SELECTOR_ACCESS_OBJECT['kashi_roma'].innerHTML = '&#8203;';
	SELECTOR_ACCESS_OBJECT['kashi_roma'].classList.add('gothicfont')
	SELECTOR_ACCESS_OBJECT['kashi_sub'].classList.add('gothicfont')
	if(SELECTOR_ACCESS_OBJECT['flick-input']){
		SELECTOR_ACCESS_OBJECT['kashi_sub'].style.display = "none"
		SELECTOR_ACCESS_OBJECT['kashi_next'].classList.add('kashi_omit')
		if(PHONE_FLAG){
			document.activeElement.blur()
			SELECTOR_ACCESS_OBJECT['flick-input-second'].focus()
			SELECTOR_ACCESS_OBJECT['flick-input'].focus()
			setTimeout(function(){
				document.activeElement.blur()
				SELECTOR_ACCESS_OBJECT['flick-input-second'].focus()
				SELECTOR_ACCESS_OBJECT['flick-input'].focus()
			},0)
		}
	}
	SELECTOR_ACCESS_OBJECT['kashi'].innerHTML = "<ruby>　<rt>　</rt></ruby>";
	SELECTOR_ACCESS_OBJECT['kashi_next'].innerHTML = "<ruby>　<rt>　</rt></ruby>";

	control_default_size=(document.documentElement.scrollTop+CONTROLBOX_SELECTOR.getBoundingClientRect().top+CONTROLBOX_SELECTOR.clientHeight)
	checkbox_effect_mod_open_play()
	checkbox_effect_play()
	starting_kashi_area()
}
function is_in_sight(jq_obj) {
	var scroll_top    = window.scrollY;
	var scroll_bottom = scroll_top + window.innerHeight;
	var target_top    = document.documentElement.scrollTop+jq_obj.getBoundingClientRect().top;
	var target_bottom = target_top + parseInt(window.getComputedStyle(jq_obj).height);
	if (scroll_bottom > target_top) {

		setTimeout(function (){
			if(document.getElementsByName('play-scroll')[0].checked){
				window.scrollTo({
					top: (document.documentElement.scrollTop+CONTROLBOX_SELECTOR.getBoundingClientRect().top+CONTROLBOX_SELECTOR.clientHeight+Number(document.getElementsByName('scroll-adjustment')[0].selectedOptions[0].value)-document.documentElement.clientHeight)
				})
			}},50);

	}
}

function press_skip(){
		if(!reset_flag){
			player.seekTo( (parseFloat(lyrics_array[count][0]) - player.difftime - 1) + (1-speed) );
		}else{
			player.seekTo( ((lyrics_array[logcount-1][0]) - player.difftime-1) + (1-speed) )
			count= logcount-2>=0 ? logcount-2 : 0
		}
		reset_flag=false;
		seeked_count = count;
		stop_count = 0;
		if(keyboard == "mac"){
			document.getElementById("tap_here").style.display = "none"
			document.getElementById("tap_here").style.opacity = "1"
		}
		SELECTOR_ACCESS_OBJECT['skip-guide'].textContent = "";
		playheadUpdate();
}

let video_thumbnail_souce_name = ["maxresdefault","mqdefault","mqdefault.jpg"]
function get_video_thumbnail(){

	img_html_set(player.getVideoData().video_id)
}
function img_html_set(YouTubeVideoId){
	const Quality = new Image(); // インスタンス化
	Quality.onload = () => {
		img_load_event(Quality.height,Quality.width,Quality.src)
	}
	if(video_thumbnail_souce_name[0] == "maxresdefault" || video_thumbnail_souce_name[0] == "mqdefault"){
		//webp形式のサムネイルが設定されていない動画も存在する（昔の動画に多い？）
		Quality.src = `https://i.ytimg.com/vi_webp/`+YouTubeVideoId+`/`+video_thumbnail_souce_name[0]+`.webp`
	}else{
		//mqdefault.jpgのサムネイルはどの動画にも存在する模様
		Quality.src = `https://img.youtube.com/vi/`+YouTubeVideoId+`/`+video_thumbnail_souce_name[0]
	}
}
function img_load_event(h,w,s){

	//高画質なサムネイルが存在しない場合はW120×H90の灰色のサムネイルが取得される
	//W120×H90のサムネイルが取得されたら一つグレードが下のサムネイルを取得する
	if(h == 90 && w == 120){
		video_thumbnail_souce_name.shift()
		img_html_set(player.getVideoData().video_id)
	}else{
		const cover_width = getComputedStyle( document.getElementById("player"), null ) .getPropertyValue( "max-width" ) != "none" ? getComputedStyle( document.getElementById("player"), null ) .getPropertyValue( "max-width" ) : getComputedStyle( document.getElementById("player"), null ) .getPropertyValue( "width" )
		const cover_height = getComputedStyle( document.getElementById("player"), null ) .getPropertyValue( "max-height" ) != "none" ? getComputedStyle( document.getElementById("player"), null ) .getPropertyValue( "max-height" ) : getComputedStyle( document.getElementById("player"), null ) .getPropertyValue( "height" )

		document.getElementById("player").insertAdjacentHTML('beforebegin',
															 `<style>

.anim-box.fadein.is-animated {
  animation: fadeIn 0.5s cubic-bezier(0.33, 1, 0.68, 1) 1 forwards;
}

.anim-box_slow.fadein_slow.is-animated_slow {
  animation: fadeIn 0.7s cubic-bezier(0.33, 1, 0.68, 1) 1 forwards;
}

@keyframes fadeIn {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}
.anim-box_out.fadeout.is-animated_out {
  animation: fadeout 0.5s cubic-bezier(0.33, 1, 0.68, 1) 1 forwards;
}

@keyframes fadeout {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

</style>
<span id="movie_cover_black_layer" style="
     width: ${cover_width};
     height: ${cover_height};
     position: absolute;
     display:none;
     background:#000;
"></span>
<span id="movie_cover" style="
    width: ${cover_width};
    height: ${cover_height};
    position: absolute;
    display:none;
    background-image:url(${s});
    background-size: cover;
    cursor:pointer;
"></span>`)
		document.getElementById("movie_cover").addEventListener("click",retry_movie)

	}
}

function play_focus(){
	if(SELECTOR_ACCESS_OBJECT['flick-input']){
		SELECTOR_ACCESS_OBJECT['flick-input'].focus()
		SELECTOR_ACCESS_OBJECT['flick-input'].setSelectionRange(SELECTOR_ACCESS_OBJECT['flick-input'].value.length, SELECTOR_ACCESS_OBJECT['flick-input'].value.length);
	}else{
		document.activeElement.blur();
	}
}

let playarea_save
let pause_flag = false
var finished_practice
onPlayerStateChange = function (event) {

	switch(event.data){
		case 1: //再生(player.playVideo)
			demo_video_delete()
			if(!SELECTOR_ACCESS_OBJECT['flick-input']){
				play_focus()
			}
			document.getElementById("preview_shortcut").style.visibility = "hidden"
			if (finished) {
				player.pauseVideo()
				return;
			}
			else if(!is_played) {//プレイ開始

				window.removeEventListener("keyup", set_preview_video,true);
				window.removeEventListener('keydown',enter_ranking_entry,true);
				is_played = true;
				play_preparation()
				play_movie();
				start_movie();
				window.removeEventListener('keydown', press_start ,true);

				if(document.getElementById("playBotton3") != null){document.getElementById("playBotton3").remove()}
				playarea_save = document.getElementsByClassName("playarea")[0].cloneNode(true);
				gauge_html_save = document.getElementById("gauge").cloneNode(true);
				is_in_sight(document.getElementById("youtube-movie"));
				DefaultPlaySpeed = 1
				if(play_mode == 'practice' || title_speed){
					if(play_speed > 1 || title_speed){
						DefaultPlaySpeed = play_speed
					}
					if(play_mode == 'practice'){
						typing_practice_generator()
					}
				}
			} else {//ポーズから復帰
				if(pause_flag && (!OPTION_ACCESS_OBJECT['replay-mode'] ||OPTION_ACCESS_OBJECT['replay-mode'] && !line_typinglog_log[count-1][push_counter])){
					replace_complete_area("▶")
				}
				pause_flag = false
				if(document.getElementById("flick_pause_cover") != null){
					document.getElementById("flick_pause_cover").style.display = "none"
				}
				createjs.Ticker.addEventListener("tick", playheadUpdate);
				window.removeEventListener('keydown',esc_play_movie,true);
				window.removeEventListener('keydown',miss_limit_mode_space_disable,true);
				window.removeEventListener("keyup", set_preview_video,true);
				if(keyboard == "mac"){
					document.getElementById("kashi_area").addEventListener("click",press_skip,false)
				}else{
					SELECTOR_ACCESS_OBJECT['skip-guide'].addEventListener("click",press_skip,false)
				}
				if(SELECTOR_ACCESS_OBJECT['flick-input']){
					window.addEventListener("keydown",key_device_disabled)
					SELECTOR_ACCESS_OBJECT['flick-input'].addEventListener('input',keydownfunc,true);
					SELECTOR_ACCESS_OBJECT['flick-input-second'].addEventListener('input',keydownfunc,true);
				}else{
					window.addEventListener('keydown',keydownfunc,true);
				}
			}
			if(PHONE_FLAG){
				player.setPlaybackRate(speed)
			}
			break;
		case 0 && !finished ://プレイ終了(player.stopVideo)
		case -1 && finished && !type_per_min:
		case finished && 2 :
			finished = true;
			if(PHONE_FLAG){
				player.setPlaybackRate(1)
			}
			if(!type_per_min){
				document.getElementById("movie_cover_black_layer").style.display = "block"
				document.getElementById("movie_cover").style.display = "block"

				document.getElementById("movie_cover").classList.remove('anim-box_out','fadeout','is-animated_out');

				document.getElementById("movie_cover").classList.add('anim-box','fadein','is-animated');
				not_play_event()
				window.addEventListener('keydown',retry_movie,true);
				type_per_min=typing_speed*60
				if(SELECTOR_ACCESS_OBJECT['flick-input']){kana_mode=false}
				if(next_char[0]){line_result_check()}
				if(play_mode != "practice"){
					window.addEventListener('keydown',enter_ranking_entry,true);
					typing_result_status();
					typing_result_generator()
				}
				window.addEventListener("keyup", set_preview_video,true);
				document.getElementById("preview_shortcut").style.visibility = "visible"
				finish_comment();
			}
			break;
		case !finished && 2 : //一時停止(player.pauseVideo)
			if(!OPTION_ACCESS_OBJECT['replay-mode'] ||OPTION_ACCESS_OBJECT['replay-mode'] && !line_typinglog_log[count-1][push_counter]){
				replace_complete_area("ll")
			}
			if(PHONE_FLAG){
				player.setPlaybackRate(1)
			}
			pause_flag = true
			if(document.getElementById("flick_pause_cover") != null || SELECTOR_ACCESS_OBJECT['flick-input']){
				document.getElementById("flick_pause_cover").style.display = "block"
				document.getElementById("tap_here").style.display = "none"
				window.removeEventListener("keydown",key_device_disabled)
			}
			if(!SELECTOR_ACCESS_OBJECT['flick-input']){play_focus()}
			if (!stop_time_flag) { //練習モードで止まってない
				window.addEventListener('keydown',esc_play_movie,true);
				window.addEventListener("keyup", set_preview_video,true);
				document.getElementById("preview_shortcut").style.visibility = "visible"
				not_play_event()
			}
			break;
		case 3 : //スキップ(player.seekTo)
			if(PHONE_FLAG){
				player.setPlaybackRate(1)
			}
			break;
	}
}



function esc_play_movie(){
	if(event.key=="Escape" && !player_demo){//Escでポーズ解除
		player.playVideo()
		event.preventDefault();
	}
}

function practice_retry(){
	reset_flag = true
	count = 0
	player.seekTo(0)
	seek_practice_line(0,0)
	replace_complete_area("⟳")
}

let finishe_move = false
function move_practice_mode(){
	let res
	if(finished && document.querySelector("#result_comment [type=button]")==null && PHONE_FLAG){
		res = true
	}else{
		res = confirm("練習モードに切り替えます。");
	}
	if(finished && document.querySelector("#result_comment [type=button]")==null || res == true ) {

		play_mode = "practice"
		update_status()
		logcount = logcount_save
		typing_practice_generator()
		nothing_line_log.push([movieTotalTime*speed,"", Math.round(score), count, 3, 2]);
		let typinglog_save = typinglog.concat(nothing_line_log)
		let clear_word = ""
		typinglog_save.sort( function(a,b) {return a[0] - b[0];} )

		for(let i = 0; i <= typinglog_save.length-1; i++){//入力した文字の数繰り返す
			if(logcount == typinglog_save[i][3] && typinglog_save[i][5] == 1){//正当
				clear_word += i > 0 && typinglog_save[i-1][5] == 0 && typinglog_save[i][3] == typinglog_save[i-1][3] ? '<span style="color:#FF3554;">'+typinglog_save[i][1].replace(' ', '⎽')+'</span>' : '<span style="color:#60d7ff;">'+typinglog_save[i][1].replace(' ', '⎽')+'</span>'
			}
			if(logcount < typinglog_save[i][3]){//ラインの更新
				logcount = typinglog_save[i][3]
				if(typinglog_save[i-1][4] != 3){
					clear_word += typinglog_save[i-1][5] == 0 && escape_word_length_log[logcount-2][0] ? '<span style="color:#ae81ff">'+escape_word_length_log[logcount-2][0][0].replace(' ', '⎽').replace(/</g, '&lt;')+'</span>'+escape_word_length_log[logcount-2][0].slice(1).replace(/</g, '&lt;') : escape_word_length_log[logcount-2][0].replace(/</g, '&lt;')
					document.querySelector('[number="'+[logcount-2]+'"] .statu_speed').classList.add('passed');
					document.querySelector('[number="'+[logcount-2]+'"] .statu_speed').textContent = '打/秒: '+latency_kpm_rkpm_log[logcount-2][1].toFixed(2)+',　初速抜き: '+latency_kpm_rkpm_log[logcount-2][2].toFixed(2)
					document.querySelector('[number="'+[logcount-2]+'"] .statu_miss').textContent = line_typing_count_miss_count_log[logcount-2][1]
					document.querySelector('[number="'+[logcount-2]+'"] .statu_score').textContent = (line_score_log[logcount-2][0]/2000).toFixed(2)
					if(!escape_word_length_log[logcount-2][0]){
						clear_word = clear_word.replace(/<span style="color:#60d7ff;">/g,'<span style="color:rgb(30, 255, 82);">')
					}
					document.querySelector('[number="'+[logcount-2]+'"] .daken_moji').innerHTML = clear_word
					document.querySelector('[number="'+[logcount-2]+'"] .pass').innerHTML = !escape_word_length_log[logcount-2][0] ? '<span class="seikou" style="color:#FFFF00;">clear</span>' : '<span class="sippai" style="color:#F12FFF;">failed</span>'
					clear_word = ""
					i--
				}
			}
		}
		logcount = Number(document.querySelector('[number]').getAttribute('number'))+1
		if(finished){
			finishe_move = true
			practice_retry() }

	}
}


function retry_movie(event){
	if(SELECTOR_ACCESS_OBJECT['flick-input']){kana_mode=true}
	if( (event.type == "click" || event.key=="F4") && (document.activeElement.tagName != "INPUT" && document.querySelector("#result_comment [type=button]")!=null && !ranking_Enter_flag && play_mode == "normal" || play_mode == "practice")){


		(play_mode == "normal" ? song_reset:practice_retry)(event.type);


		document.getElementById("preview_shortcut").style.visibility = "hidden"
		demo_video_delete()
		window.removeEventListener('keydown',retry_movie,true);
	}else if(play_mode == "normal" && event.key=="F7" && document.activeElement.tagName != "INPUT" || (event.type == "click" && document.querySelector("#result_comment [type=button]")==null)){
		if(document.getElementById("typing-line-list-container") != null){
			document.getElementById("typing-line-list-container").remove()
			typing_count_save = 0
		}
		move_practice_mode()


		event.preventDefault();
	}else if(event.key=="F3" || event.key=="F7"){
		event.returnValue = false;
		event.preventDefault();
	}
}

var notes_list;
var line_difficulty_data;
play_movie = function () {

	updateLineView()
	createjs.Ticker.addEventListener("tick", playheadUpdate);
	createjs.Ticker.timingMode = createjs.Ticker.RAF;
	if(SELECTOR_ACCESS_OBJECT['flick-input']){
		SELECTOR_ACCESS_OBJECT['flick-input'].addEventListener('input',keydownfunc,true);
		SELECTOR_ACCESS_OBJECT['flick-input-second'].addEventListener('input',keydownfunc,true);
	}else{
		window.addEventListener('keydown',keydownfunc,true);
	}
	add_line_typingword(count)
}


/**
*@プレイ前準備の関数変更 ここまで---
*/
/////////////////////////////////////////////////////////////////////////////////////////////////




function replace_complete_area(replace){
	document.getElementById("complete_effect").parentNode.replaceChild(complete_html_save,document.getElementById("complete_effect"));
	if(replace != "ll"){
		document.getElementById("complete_effect").classList.add('countdown_animation','complete_animated')
	}else{
		document.getElementById("complete_effect").classList.remove('countdown_animation','complete_animated')
	}
	document.getElementById("complete_effect").innerHTML = replace
}





/////////////////////////////////////////////////////////////////////////////////////////////////
/**
*@MOD設定保存・反映 ここから---
*/



/**
 * MOD Menuの設定が変更されたときに変更内容をlocalStorageに保存する
 * @param {event} 設定変更があった要素
 */

function backUpIndexedDb(EVENT_TARGET){
	/**
      * 設定を変更した要素のName属性とValueをIndexedDBにPutする
      * @param SAVE_DATA {array} 配列データを返します。[EventTargetName , EventTargetValue]
      */
	const SAVE_DATA = modConfigLocalStorageSave(EVENT_TARGET)
	if(SAVE_DATA){
		putOptionSaveData(SAVE_DATA[0] , SAVE_DATA[1])
	}
}

function putOptionSaveData(OptionName , Data){
	const SEND_DATA = { OptionName : OptionName, Data : Data };
	const OPEN_REQ = window.indexedDB.open(STORE_NAME);

	OPEN_REQ.onsuccess = function(event){
		var db = event.target.result;
		var trans = db.transaction(STORE_NAME, 'readwrite');
		var store = trans.objectStore(STORE_NAME);
		var putReq = store.put(SEND_DATA);
	}
}
function saveModOption(event){


	if(event){ //changeイベントで変更があった設定を保存

		const EVENT_TARGET = event.target;

		if(EVENT_TARGET.name === 'tab-item'){
			return;
		}
		backUpIndexedDb(EVENT_TARGET);
		if(EVENT_TARGET.name === 'color-preset'){
			if(document.getElementsByName('color-preset')[0].value == "デフォルト"){
				color_default();
			}else if(document.getElementsByName('color-preset')[0].value == "先頭の文字を赤く強調"){
				letter_red();
			}else if(document.getElementsByName('color-preset')[0].value == "入力スタイル"){
				letter_input_style();
			}else if(document.getElementsByName('color-preset')[0].value == "打つと消える"){
				transparent_style();
			}
			document.getElementsByName('color-preset')[0].selectedIndex = 0;
			allSave();
		}else{
			modConfigLocalStorageSave(EVENT_TARGET);
		}

	}else{ //全ての設定を一括保存
		allSave();
	}

		//設定を反映
		checkbox_effect();
		checkbox_effect_mod_open_play();
		checkbox_effect_play();

		//カラーコードの状態保存
		OnColorChanged();

		if(!finished){
			map_info_generator();

		}

	}

function allSave() {
	const MOD_LOCALSTORAGE_CONFIG_DATA = document.querySelectorAll(".mod-tab-content [name]");

	for(let i=0; i<MOD_LOCALSTORAGE_CONFIG_DATA.length; i++){
		const SAVE_DATA = modConfigLocalStorageSave(MOD_LOCALSTORAGE_CONFIG_DATA[i]);
		if(SAVE_DATA != undefined){
			putOptionSaveData(SAVE_DATA[0] , SAVE_DATA[1]);
		}
	}
}

/**２
 * MOD設定メニューの内容をlocalStorageに保存する
 * @param {DOM} 設定を保存するinputタグ
 */

function modConfigLocalStorageSave(saveTarget){

	if(saveTarget.type === 'checkbox'){
		return [saveTarget.name,saveTarget.checked];
	}else if(saveTarget.type === 'radio'){
		for(let i = 0; i<document.getElementsByName(saveTarget.name).length;i++){
			if(document.getElementsByName(saveTarget.name)[i].checked){
				return [saveTarget.name,i];
			}
		}
	}else if(saveTarget.type === 'number'){
		return [saveTarget.name,saveTarget.value > 100 ? 100 : saveTarget.value];
	}else if(saveTarget.tagName === 'SELECT'){
		return [saveTarget.name,saveTarget.selectedIndex];
	}else if(saveTarget.className.match('color')){
		return [saveTarget.name,saveTarget.value];
	}
}




//カラーコードをlocalstorageに保存
function OnColorChanged(selectedColor, input) {

	if(selectedColor){
		putOptionSaveData(input.name ,selectedColor);
		OPTION_ACCESS_OBJECT[input.name] = selectedColor;
	}

	//設定を反映
	CONTROLBOX_SELECTOR.style.backgroundColor = document.getElementsByName('playarea-color')[0].value;
	updateProgressStyleTag();

	if(!is_played){
		document.getElementById("esckey").style.color = document.getElementsByName('status-area-color')[0].value;

		for(let i=0;i<document.getElementsByClassName("playButton").length;i++){
			document.getElementsByClassName("playButton")[i].style.color = document.getElementsByName('status-area-color')[0].value;
		}
	}else if(is_played && !finished){
		SELECTOR_ACCESS_OBJECT['kashi'].style.color = document.getElementsByName('lyric-color')[0].value;
		SELECTOR_ACCESS_OBJECT['kashi_next'].style.color = document.getElementsByName('next-lyric-color')[0].value;
		SELECTOR_ACCESS_OBJECT['next-kpm'].style.color = document.getElementsByName('next-lyric-color')[0].value;
		updateLineView();
		updateLineView_typing(true);
	}
}


//スクロール調整機能を設定時に反映
function scroll_change(){

	if(is_played&&!finished){
		window.scrollTo({top:(document.documentElement.scrollTop+CONTROLBOX_SELECTOR.getBoundingClientRect().top+CONTROLBOX_SELECTOR.clientHeight+Number(document.getElementsByName('scroll-adjustment')[0].selectedOptions[0].value)-document.documentElement.clientHeight)})
	}
}


//タイピングワードのフォントサイズ設定を反映
function set_status_setting(){
	if(mode!="roma"&&mode!="kana"){return}
const TEXT_SHADOW_PX = document.getElementsByName('font-shadow-px')[0].textContent
	document.getElementById("status_setting").innerHTML= `
#kashi_roma{font-size:${document.getElementsByName('kana-font-size-px')[0].textContent}px;letter-spacing:${document.getElementsByName('kana-font-spacing-px')[0].textContent}px;}
#kashi_sub{font-size:${document.getElementsByName('roma-font-size-px')[0].textContent}px;letter-spacing:${document.getElementsByName('roma-font-spacing-px')[0].textContent}px;}
.text_shadow{
   text-shadow:black ${TEXT_SHADOW_PX}px 0px,  black -${TEXT_SHADOW_PX}px 0px,
    black 0px -${TEXT_SHADOW_PX}px, black 0px ${TEXT_SHADOW_PX}px,
    black ${TEXT_SHADOW_PX}px ${TEXT_SHADOW_PX}px , black -${TEXT_SHADOW_PX}px ${TEXT_SHADOW_PX}px,
    black ${TEXT_SHADOW_PX}px -${TEXT_SHADOW_PX}px, black -${TEXT_SHADOW_PX}px -${TEXT_SHADOW_PX}px,
    black 1px ${TEXT_SHADOW_PX}px,  black -1px ${TEXT_SHADOW_PX}px,
    black 1px -${TEXT_SHADOW_PX}px, black -1px -${TEXT_SHADOW_PX}px,
    black ${TEXT_SHADOW_PX}px 1px,  black -${TEXT_SHADOW_PX}px 1px,
    black ${TEXT_SHADOW_PX}px -1px, black -${TEXT_SHADOW_PX}px -1px;
}
`
}



let auto_scroll_flag = true
const OPTION_ACCESS_OBJECT = {}
let mode_select
function Manual_scroll(e) {
	auto_scroll_flag = false
}
//プレイ中に必要な設定を反映(プレイ開始時に1度読み込まれる)
function checkbox_effect_play(){
	if(is_played && !finished){
		const DURING_PLAY_OPTIONS = document.getElementsByClassName("during-play-option")
		for(let i=0;i<DURING_PLAY_OPTIONS.length;i++){
			const OPTION_NAME = DURING_PLAY_OPTIONS[i].getAttribute('name')

			if(DURING_PLAY_OPTIONS[i].type === 'number'){
				if(OPTION_NAME.match('volume')){
					OPTION_ACCESS_OBJECT[OPTION_NAME] = DURING_PLAY_OPTIONS[i].value/100
				}else{
					OPTION_ACCESS_OBJECT[OPTION_NAME] = DURING_PLAY_OPTIONS[i].value
				}
			}else if(DURING_PLAY_OPTIONS[i].type === 'checkbox' || DURING_PLAY_OPTIONS[i].type === 'radio'){
				OPTION_ACCESS_OBJECT[OPTION_NAME] = DURING_PLAY_OPTIONS[i].checked
			}else if(DURING_PLAY_OPTIONS[i].tagName === 'SELECT'){
				OPTION_ACCESS_OBJECT[OPTION_NAME] = DURING_PLAY_OPTIONS[i].selectedOptions[0].value
			}else if(DURING_PLAY_OPTIONS[i].tagName === 'SPAN'){
				OPTION_ACCESS_OBJECT[OPTION_NAME] = +DURING_PLAY_OPTIONS[i].textContent
			}else if(DURING_PLAY_OPTIONS[i].className.match('color')){
				OPTION_ACCESS_OBJECT[OPTION_NAME] = DURING_PLAY_OPTIONS[i].value;
			}
		}

		mode_select = document.querySelector("[name=mode_select]:checked").value;
		SELECTOR_ACCESS_OBJECT['combo-value'].textContent = OPTION_ACCESS_OBJECT['combo-counter-effect'] && typing_count ? combo : "";
		LoadSoundEffect()
		if(OPTION_ACCESS_OBJECT['play-scroll']){
			window.addEventListener('scroll',Manual_scroll)
		}else{
			window.removeEventListener('scroll',Manual_scroll)
		}
		if(next_char[0] && kana_mode){
			line_input_kana = daku_handaku_join(true,false,line_input_kana);
		}

		const STATUS_RANKING_AREA = document.querySelector("#controlbox .col-4")
		const TYPING_AREA = document.querySelector("#controlbox .col-8")

		if(!OPTION_ACCESS_OBJECT['status-mode']){
			TYPING_AREA.style.flex="0 0 100%";
			TYPING_AREA.style.maxWidth="100%";
			STATUS_RANKING_AREA.style.flex="0 0 100%";
			STATUS_RANKING_AREA.style.maxWidth="100%";

		}else{
			TYPING_AREA.style.flex="0 0 75.66667%";
			TYPING_AREA.style.maxWidth="75.66667%";
			STATUS_RANKING_AREA.style.flex="0 0 24.33333%";
			STATUS_RANKING_AREA.style.maxWidth="24.33333%";
		}




		if(OPTION_ACCESS_OBJECT['character-scroll']){
			SELECTOR_ACCESS_OBJECT['kashi_roma'].classList.add('character-scroll')
			SELECTOR_ACCESS_OBJECT['kashi_sub'].classList.add('character-scroll')
			SELECTOR_ACCESS_OBJECT['kashi_roma'].classList.remove('mt-2')
			SELECTOR_ACCESS_OBJECT['kashi_sub'].classList.remove('mt-2')
			SELECTOR_ACCESS_OBJECT['kashi_roma'].setAttribute("style", "margin-top: .2rem!important;");

		}else{
			SELECTOR_ACCESS_OBJECT['kashi_roma'].classList.remove('character-scroll')
			SELECTOR_ACCESS_OBJECT['kashi_sub'].classList.remove('character-scroll')
			SELECTOR_ACCESS_OBJECT['kashi_roma'].classList.add('mt-2')
			SELECTOR_ACCESS_OBJECT['kashi_sub'].classList.add('mt-2')
			SELECTOR_ACCESS_OBJECT['kashi_roma'].setAttribute("style", "margin-top: .8rem!important;");

		}

		if(mode == 'roma'){
			SELECTOR_ACCESS_OBJECT['kashi_roma'].classList.add('roma-input-dom')
			SELECTOR_ACCESS_OBJECT['kashi_sub'].classList.add('kana-input-dom')
			SELECTOR_ACCESS_OBJECT['kashi_roma'].classList.remove('kana-input-dom')
			SELECTOR_ACCESS_OBJECT['kashi_sub'].classList.remove('roma-input-dom')
			SELECTOR_ACCESS_OBJECT['kashi_sub'].style.textTransform = !OPTION_ACCESS_OBJECT['case-sensitive-mode'] ? "lowercase" : "";
			SELECTOR_ACCESS_OBJECT['kashi_roma'].style.textTransform = !OPTION_ACCESS_OBJECT['case-sensitive-mode'] ? "lowercase" : "";
		}else if(mode == 'kana'){
			SELECTOR_ACCESS_OBJECT['kashi_roma'].classList.add('kana-input-dom')
			SELECTOR_ACCESS_OBJECT['kashi_sub'].classList.add('roma-input-dom')
			SELECTOR_ACCESS_OBJECT['kashi_roma'].classList.remove('roma-input-dom')
			SELECTOR_ACCESS_OBJECT['kashi_sub'].classList.remove('kana-input-dom')
			SELECTOR_ACCESS_OBJECT['kashi_sub'].style.textTransform = !OPTION_ACCESS_OBJECT['case-sensitive-mode'] ? "uppercase" : "";
			SELECTOR_ACCESS_OBJECT['kashi_roma'].style.textTransform = !OPTION_ACCESS_OBJECT['case-sensitive-mode'] ? "lowercase" : "";
		}
		SELECTOR_ACCESS_OBJECT['roma-input-dom'] = document.getElementsByClassName("roma-input-dom")[0]
		SELECTOR_ACCESS_OBJECT['kana-input-dom'] = document.getElementsByClassName("kana-input-dom")[0]
		if(count){
			displayNextLyric(count);
		}
		set_status_setting();
		update_status();
	}

}







/*
*@MOD設定保存・反映 ここまで---
**/
/////////////////////////////////////////////////////////////////////////////////////////////////








////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**
*@プレイ中の処理　全体　 ここから---
*/



//打鍵周り計算
//correct
//ミス制限モード判定
//miss数カウント

let correct = 100 //正確率

let keep_correct = 0 //目標性格率と現在性格率の差
let life_correct = 0 //残りライフ(ライフ制)
//打鍵共通して呼ばれる処理

let CorrectCalc = () => {
	correct = typing_miss_count ? Math.round( (typing_count / (typing_miss_count + typing_count) * 100) * 10) / 10 : 100
	if(OPTION_ACCESS_OBJECT['miss-limit-mode']){
		//OPTION_ACCESS_OBJECT['miss-limit-correct'] = document.getElementsByName('miss-limit-correct')[0].value→目標正確率
		keep_correct= Math.round( (correct-OPTION_ACCESS_OBJECT['miss-limit-correct']) * 10) / 10
		life_correct = OPTION_ACCESS_OBJECT['miss-limit-game-mode'] ? "":total_notes-escape_word_length - (total_notes-escape_word_length) * OPTION_ACCESS_OBJECT['miss-limit-correct']/100-typing_miss_count
	}else{//ミス制限モードオフ
		keep_correct = 0
		life_correct = 0
	}
}

//Statusエリアの各項目を更新  StatusCountsUpdate(["Score","Rank","Type","Miss","Correct","Line","Escape"])
function StatusCountsUpdate(CountsItemArray){
	if(!Array.isArray(CountsItemArray)){return;}

		for(let i=0;CountsItemArray.length>i;i++){
			switch (CountsItemArray[i]) {
				case "Score":
					if(play_speed>=DefaultPlaySpeed){
						SELECTOR_ACCESS_OBJECT['score-value'].textContent = (score/2000).toFixed(2)
					}else{
						SELECTOR_ACCESS_OBJECT['score-value'].textContent = ((score + line_score)/2000).toFixed(2)

					}
					break;
				case "Rank":
					if(now_rank+1<=ranking_array.length && (100 - (escape_score/2000)) < ranking_array[now_rank] || play_mode == "practice"){
						console.log("!")
						const score_Position = ranking_array.find(element => element < 100 - (escape_score/2000) )
						now_rank = score_Position ? ranking_array.indexOf(score_Position) : ranking_array.length
						SELECTOR_ACCESS_OBJECT['rank-value'].textContent = (now_rank+1)
					}
					break;
				case "Type":
					SELECTOR_ACCESS_OBJECT['typing-count-value'].textContent = !OPTION_ACCESS_OBJECT['replay-mode'] ? practice_typing_count : typing_count
					break;
				case "Miss":
					SELECTOR_ACCESS_OBJECT['miss-value'].textContent = typing_miss_count
					break;
				case "Correct":
					CorrectCalc()
					if(OPTION_ACCESS_OBJECT['miss-limit-mode']){
						if(SELECTOR_ACCESS_OBJECT['keep-value']){
							SELECTOR_ACCESS_OBJECT['keep-value'].textContent = (OPTION_ACCESS_OBJECT['miss-limit-mode'] ? keep_correct.toFixed(1) :"")
						}
						if(!OPTION_ACCESS_OBJECT['miss-limit-game-mode']){
							SELECTOR_ACCESS_OBJECT['life-value'].textContent = life_correct.toFixed(1)
						}
					}
					typing_miss_count ? SELECTOR_ACCESS_OBJECT['correct-value'].textContent = correct.toFixed(1) : SELECTOR_ACCESS_OBJECT['correct-value'].textContent = 100
					break;
				case "Line":
					if(play_mode == "normal"){
						SELECTOR_ACCESS_OBJECT['line-count-value'].textContent = (line_length-(failer_count+complete_count))
					}else{
						SELECTOR_ACCESS_OBJECT['line-count-value'].textContent = line_length-complete_count
					}
					break;
				case "Escape":
					SELECTOR_ACCESS_OBJECT['escape-value'].textContent = escape_word_length
					break;
			}
		}
}


let practice_typing_count = 0
let typing_count_kana_mode = 0
let typing_count_roma_mode = 0
let typing_count_flick_mode = 0
//正解打鍵処理
let now_rank = 0
function add_typing_count(c){
	typing_count++;
	if(play_mode == "normal"){
		if(kana_mode && keyboard == "normal"){
			typing_count_kana_mode++
		}else if(kana_mode && SELECTOR_ACCESS_OBJECT['flick-input']){
			typing_count_flick_mode++
		}else{
			typing_count_roma_mode++
		}
	}
	practice_typing_count++
	combo++;
	if(max_combo < combo){max_combo = combo;}
	miss_combo = 0;
	if(score > 199999){score = 200000}

	line_typinglog.push([c , 1 , headtime+practice_time , kana_mode]);



	if(!next_char[0]) { //ラインクリア時の打鍵タイム加算
		if(stop_time_flag) {
			practice_time_current += ((new Date).getTime()-stop_time)/1000
			practice_speed_time = 0
			createjs.Ticker.removeEventListener("tick", time_calculation);
			time_calculation(false)
			player.playVideo();
		}
		completed = true;
		clear_time_log.splice(count-1, 1, line_playing_time);
		if(completed && escape_word_length_log[count-1][2] != 1){
			complete_count ++;
			StatusCountsUpdate(["Line"])

			//クリアゲージ
			if(lineClearRate <= 80){
				lineClearRate=(complete_count / line_length) * 100.0;
				lineClearGauge80RateLessThanSelector.style.width=(lineClearRate*1.25)+"%";
				lineClearGauge80RateLessThanSelector.style.backgroundColor="#fff";
				if(lineClearRate>=80){
					lineClearRateSelector.style.color="#FFEB3B";
					lineClearGauge80RateMoreThanSelector.style.backgroundColor="#FFEB3B";
					document.querySelector("#gauge2 > span").style.cssText = "";
					lineClearGauge80RateMoreThanSelector.style.width=(((lineClearRate-80)*5)+1)+"%";
				}
			}else{
				lineClearRate=(complete_count / line_length) * 100.0;
				lineClearGauge80RateMoreThanSelector.style.width=(lineClearRate-80)*5+"%";
			}

		}

		line_clear_effect()
		past_playing_time += clear_time_log[count-1]
		line_result_check()
		stop_time_flag = false
	}
	StatusCountsUpdate(["Type","Correct"])
	typing_speed_calculation()
	typinglog.push([headtime, c, Math.round(score), count, completed ? 1 : 0, 1]);
}


//打鍵効果音
//コンボエフェクト

let combo100 = false; //100コンボ以上ならtrue

function type_effect(){

	if(OPTION_ACCESS_OBJECT['combo-counter-effect'] && combo>=1){
		SELECTOR_ACCESS_OBJECT['combo-value'].innerHTML = "<div class='combo_animated'id='combo_anime'>"+combo+"</div>"
	}

	if (OPTION_ACCESS_OBJECT['typing-sound-effect'] && !completed) {key_type_play()}

	if(combo >= 100){combo100 = true;}

}


//タイピングワードのみ更新
//正解打鍵をした時更新
var typing_carsor_time = 0
var typing_carsor_flag = false
function updateLineView_typing(kana_update_flag) {

	let kana_first_letter = ""
	let kana_words = ""

	let roma_first_letter = ""
	let roma_words = ""
	let space_disable_space_html = ""
	if(next_char.length > 1){
		space_disable_space_html = !space_disable && next_char[0][next_char[0].length-1] == " " ? " " : ""
		kana_first_letter = (next_char[0][0] || "")
		if(kana_update_flag){
			kana_words = next_char[0].slice(1)
		}
		if(!kana_mode){
			roma_first_letter = (OPTION_ACCESS_OBJECT['case-sensitive-mode'] && /[A-ZＡ-Ｚ]/.test(next_char[0]) ? next_char[1][0].toUpperCase() : next_char[1][0] || "")
			roma_words = (next_char[1].slice(1) +space_disable_space_html+ line_input_roma.join(''))
		}
	}




	if(OPTION_ACCESS_OBJECT['character-scroll']){
		if(kana_update_flag){
			SELECTOR_ACCESS_OBJECT['correct-input-kana'].innerHTML = already_input.substr(-OPTION_ACCESS_OBJECT['kana-scroll-length'],OPTION_ACCESS_OBJECT['kana-scroll-length']).replace(/</g, '&lt;').replace(/ /g, "<span class=underline>&nbsp;</span>" )
		}
		if(!kana_mode){SELECTOR_ACCESS_OBJECT['correct-input-roma'].innerHTML = already_input_roma.substr(-OPTION_ACCESS_OBJECT['roma-scroll-length'],OPTION_ACCESS_OBJECT['roma-scroll-length']).replace(/</g, '&lt;').replace(/ /g, "<span class=underline>&nbsp;</span>" )}
	}else{
		if(kana_update_flag){
			SELECTOR_ACCESS_OBJECT['correct-input-kana'].innerHTML = already_input.replace(/</g, '&lt;').replace(/ /g, "<span class=underline>&nbsp;</span>" )
		}
		if(!kana_mode){SELECTOR_ACCESS_OBJECT['correct-input-roma'].innerHTML = already_input_roma.replace(/</g, '&lt;').replace(/ /g, "<span class=underline>&nbsp;</span>" )}
	}
	if(kana_update_flag || miss_combo || typing_count - typing_count_save == 0){
		SELECTOR_ACCESS_OBJECT['kana-first-word'].innerHTML = kana_first_letter
	}
	if(!kana_mode){
		SELECTOR_ACCESS_OBJECT['first-color-roma'].innerHTML = roma_first_letter
		SELECTOR_ACCESS_OBJECT['typing-word-roma'].innerHTML = roma_words
	}
	//英単語をハイライトするモード
	if(kana_update_flag){
		if(OPTION_ACCESS_OBJECT['character-word-highlight'] && /[^!-~]/.test(next_char[0]) == false && ((/.*[ぁ-ん|ゔ|ー|、|。|゛]$/.test(already_input)||already_input=='') && (/^[ぁ-ん|ゔ|ー|、|。|゛].*/.test(line_input_kana[0]) || line_input_kana[0] == undefined)) == false){
			SELECTOR_ACCESS_OBJECT['kana-first-word'].style.textDecoration = "underline"
			SELECTOR_ACCESS_OBJECT['kana-second-word'].style.textDecoration = "underline"
			if(kana_mode){SELECTOR_ACCESS_OBJECT['kana-second-word'].style.color = OPTION_ACCESS_OBJECT['next-character-color']}
			SELECTOR_ACCESS_OBJECT['kana-second-word'].innerHTML = ( line_input_kana.join('').substr(0,(line_input_kana.join('')+" ").search(/[^!-~]/)) )
			SELECTOR_ACCESS_OBJECT['typing-word-kana'].innerHTML = ( (line_input_kana.join('')+" ").slice(line_input_kana.join('').search(/[^!-~]/)) )

		}else{
			SELECTOR_ACCESS_OBJECT['kana-first-word'].style.textDecoration = ""
			SELECTOR_ACCESS_OBJECT['kana-second-word'].style.textDecoration = ""
			if(kana_mode){SELECTOR_ACCESS_OBJECT['kana-second-word'].style.color = OPTION_ACCESS_OBJECT['word-color']}
			SELECTOR_ACCESS_OBJECT['kana-second-word'].innerHTML = kana_words
			SELECTOR_ACCESS_OBJECT['typing-word-kana'].innerHTML = line_input_kana.join('')
		}
	}

}



///////////////////////////////////////////////////////////////////////

let kana_score = 0
let roma_score = 0
let lineClearRate=0 //ラインクリア率

//ミスタイピング処理
function add_typing_miss_count(){
	typing_miss_count ++;
	miss_combo ++;

	if(play_mode == "normal" && combo_challenge && typing_miss_count==1){
		combo_challenge_combo_Calc()
		const combo_challenge_roma_result = +localStorage.getItem('combo_challenge_roma')+roma_combo
		const combo_challenge_kana_result = +localStorage.getItem('combo_challenge_kana')+kana_combo
		const combo_challenge_full_combo_result = +localStorage.getItem('combo_challenge_fullcombo') + 1

		if(+localStorage.getItem('combo_challenge_roma') >= 700){
			const date = new Date()
			const date_format = date.getFullYear()+"/"+(date.getMonth()+1)+"/"+date.getDate()
			combo_challenge_beatmap_data.push([play_ID,play_Name,roma_combo,kana_combo,(score/2000).toFixed(2),typing_speed.toFixed(2),play_speed.toFixed(2),typing_count_roma_mode,typing_count_kana_mode,typing_count_flick_mode,date_format])
			if(+localStorage.getItem('combo_challenge_max_kana') < combo_challenge_kana_result || isNaN(+localStorage.getItem('combo_challenge_max_kana'))){
				localStorage.setItem('combo_challenge_max_roma',combo_challenge_roma_result)
				localStorage.setItem('combo_challenge_max_kana',combo_challenge_kana_result)
				localStorage.setItem('combo_challenge_fullcombo_max' , combo_challenge_full_combo_result)
				localStorage.setItem('combo_challenge_beatmap_data_max', JSON.stringify(combo_challenge_beatmap_data))
				localStorage.removeItem('combo_challenge_beatmap_data_last')
			}else{
				localStorage.setItem('combo_challenge_last_roma',combo_challenge_roma_result)
				localStorage.setItem('combo_challenge_last_kana',combo_challenge_kana_result)
				localStorage.setItem('combo_challenge_fullcombo_last' , combo_challenge_full_combo_result)
				localStorage.setItem('combo_challenge_beatmap_data_last', JSON.stringify(combo_challenge_beatmap_data))
			}
		}
		localStorage.removeItem('combo_challenge_kana')
		localStorage.removeItem('combo_challenge_roma')
		localStorage.removeItem('combo_challenge_fullcombo')
		localStorage.removeItem('challenge-enable')
		localStorage.removeItem('combo_challenge_beatmap_data')
		combo_challenge_beatmap_data = []
	}
	combo = 0;
	miss_diff_kana = daku_handaku_join(false,true,already_input.replace(/ /g,"").split("")).join("").length
	miss_diff_roma = already_input_roma.replace(/ /g,"").length
	typing_count_roma_mode = 0
	typing_count_kana_mode = 0
	typing_count_flick_mode = 0
	kana_combo = 0
	roma_combo = 0
	if(score>0){
		line_score -= score_per_char/4
		if(play_mode == "normal" || play_mode == "practice" && play_speed >= DefaultPlaySpeed && (OPTION_ACCESS_OBJECT['replay-mode'] || line_score_log[count-1][0] < line_score)){
			score -= score_per_char/4
			escape_score += (score_per_char/4)
		}
	}
	if(score<0){
		line_score =0
		if(play_mode == "normal" || play_mode == "practice" && play_speed >= DefaultPlaySpeed && (OPTION_ACCESS_OBJECT['replay-mode'] || line_score_log[count-1][0] < line_score)){
			score = 0
		}
	}

	if(play_mode == "practice" && OPTION_ACCESS_OBJECT['seek-line-miss'] && !push_counter){
		practice_missline_auto_set()
	}

	StatusCountsUpdate(["Score","Rank","Miss","Correct"])
	typing_speed_calculation()

}


//ミス効果音
//ミスマーク表示
//コンボエフェクトリセット
var missmark = document.createElement("span");
missmark.setAttribute("style", "position: absolute;top:"+(IOS_FLAG ? "-0.6em":"-0.55em")+";margin: auto;font-size: 1.5em;left: 50%;transform: translateX(-50%);-webkit-transform: translateX(-50%);-ms-transform: translateX(-50%);");
missmark.setAttribute("id", "missmark");
missmark.textContent="・"


function miss_effect(){
	if(OPTION_ACCESS_OBJECT['combo-counter-effect'] && miss_combo == 1){
		SELECTOR_ACCESS_OBJECT['combo-value'].textContent = "0";
	}

	if(miss_combo && typing_count - typing_count_save != 0 || OPTION_ACCESS_OBJECT['miss-beginning-sound-effect']){

		if(!combo100 || !OPTION_ACCESS_OBJECT['combo-break-sound']){

			if(OPTION_ACCESS_OBJECT['miss-sound-effect']){miss_type_play()}

		}else if(combo100){//100combo
			if(OPTION_ACCESS_OBJECT['combo-break-sound']){
				combo_break_play();//100 combo以上でミスするとcombo break音
			}
			combo100 = false;//フラグOFF
		}

	}
	if(OPTION_ACCESS_OBJECT['miss-mark-effect'] && (typing_count - typing_count_save == 0 || miss_combo == 1)){//ミス表示を追加
		missmark.style.color = typing_count - typing_count_save == 0 ? OPTION_ACCESS_OBJECT['word-color'] : OPTION_ACCESS_OBJECT['miss-effect-color']
		SELECTOR_ACCESS_OBJECT['next-character-color'].appendChild(missmark)
	}}



///////////////////////////////////////////////////////////////////////




///////////////////////////////////////////////////////////////////////



//ラインクリア処理
function line_completed(){
	next_point = 0;

	//クリア時は現在のライン経過時間を加算

	for(let i=0;i<SELECTOR_ACCESS_OBJECT['correct-input'].length;i++){
		SELECTOR_ACCESS_OBJECT['correct-input'][i].style.color = OPTION_ACCESS_OBJECT['line-clear-color']
	}
}





//クリアゲージエフェクト
function line_clear_effect(){
	if(OPTION_ACCESS_OBJECT['line-clear-gauge-effect'] && line_remaining_time > 0.6 && !push_counter){
		document.getElementById("complete_effect").classList.add('countdown_animation','complete_animated')
		document.getElementById("complete_effect").textContent = "Complete!!"
	}

	if(OPTION_ACCESS_OBJECT['clear-sound-effect']){
		clear_type_play()
	}else if(!OPTION_ACCESS_OBJECT['clear-sound-effect'] && OPTION_ACCESS_OBJECT['typing-sound-effect']){
		key_type_play()
	}

	if( (score/2000) < 50){
		lineClearRateSelector.textContent = lineClearRate.toFixed(0)+"%";
	}else if( (score/2000) >= 50 && lineClearRate < 80){
		lineClearRateSelector.innerHTML = lineClearRate.toFixed(0)+"%<i style='width: 0px;display: contents!important;color:#FFF;' class='fa fa-trophy'></i>";
	}else if(lineClearRate >= 80 && lineClearRate != 100){
		lineClearRateSelector.innerHTML = lineClearRate.toFixed(0)+"%<i style='width: 0px;display: contents!important;color:#8B4513;' class='fa fa-trophy'></i>";
	}else if(lineClearRate == 100 && (score/2000) < 99.99){
		lineClearRateSelector.innerHTML = lineClearRate.toFixed(0)+"%<i style='width: 0px;display: contents!important;color:#C0C0C0;' class='fa fa-trophy'></i>";
	}else if( (score/2000) >= 99.99){
		lineClearRateSelector.innerHTML = lineClearRate.toFixed(0)+"%<i style='width: 0px;display: contents!important;color:#FFD700;' class='fa fa-trophy'></i>";
	}
}



///////////////////////////////////////////////////////////////////////


let komoji_pattern = ["っ","ぁ","ぃ","ぅ","ぇ","ぉ","ゃ","ゅ","ょ","ゎ","ヵ","ヶ","ん"]
let OptimisationWhiteList = ["っっ","っん","っい","っう"]
//打鍵パターンを最適化
function keystroke_pattern_optimisation(){
	//ひらがな2文字の周りくどい入力方法ltuta,xtufu,silya,ltuteleなどを入力できなくする機能
	if(OPTION_ACCESS_OBJECT['sokuon-yoon-disable'] && next_char[0].length >= 2 && next_char.length >= 4){
		const next_char_before = next_char[0][next_char[0].length-2]
		const next_char_last = next_char[0][next_char[0].length-1]
		if( !(komoji_pattern.includes(next_char_before) && komoji_pattern.includes(next_char_last)) ){
			next_char=next_char.filter(function(value) { return value.match(/^(?!.*(x|l)).*$/)})
		}else if(!OptimisationWhiteList.includes(next_char_before+next_char_last)){
			next_char=next_char.filter(function(value) { return value.match(/^(?!.*(tu|tsu)).*$/)})
		}
	}

}

function miss_limit_mode_space_disable(){
	if(event.code == "Space") {
		event.preventDefault();
	}
}
///////////////////////////////////////////////////////////////////////
function perfect_mode_judge(key_judge){

	if(OPTION_ACCESS_OBJECT['miss-limit-mode']){
		if(play_mode == "normal" && ( OPTION_ACCESS_OBJECT['miss-limit-game-mode'] && correct < OPTION_ACCESS_OBJECT['miss-limit-correct'] || !OPTION_ACCESS_OBJECT['miss-limit-game-mode'] && life_correct < 0 ) ){//correctが目標製確率より下がったらゲームオーバー || ライフが0未満でゲームオーバー
			gameover()
			if(stop_time_flag){createjs.Ticker.removeEventListener("tick", time_calculation);}
			if(OPTION_ACCESS_OBJECT['gameover-sound-effect']){gameover_sound_play()}
			if(key_judge && event.code=="Space") {
				event.preventDefault();
			}
			window.addEventListener('keydown',miss_limit_mode_space_disable,true);

			return true;
		}
	}
	return false;
}

function restore_playarea(){
	document.getElementsByClassName("playarea")[0].parentNode.replaceChild(playarea_save,document.getElementsByClassName("playarea")[0]);
	SELECTOR_ACCESS_OBJECT['kashi'] = document.getElementById("kashi")
	SELECTOR_ACCESS_OBJECT['kashi_next'] = document.getElementById("kashi_next")
	SELECTOR_ACCESS_OBJECT['kashi_roma'] = document.getElementById("kashi_roma")
	SELECTOR_ACCESS_OBJECT['skip-guide'] = document.getElementById("skip-guide")
	SELECTOR_ACCESS_OBJECT['total-time'] = document.getElementById("total-time")
	SELECTOR_ACCESS_OBJECT['next-kpm'] = document.getElementById("next-kpm")
	SELECTOR_ACCESS_OBJECT['combo-value'] = document.getElementById("combo-value")
	SELECTOR_ACCESS_OBJECT['remaining-time'] = document.getElementById("remaining-time")
	SELECTOR_ACCESS_OBJECT['line-speed'] = document.getElementById("line-speed")
	SELECTOR_ACCESS_OBJECT['count-anime'] = document.getElementById("count-anime")
	SELECTOR_ACCESS_OBJECT['kashi_sub'] = document.getElementById("kashi_sub")
	SELECTOR_ACCESS_OBJECT['bar_input_base'] = document.getElementById("bar_input_base")
	SELECTOR_ACCESS_OBJECT['bar_base'] = document.getElementById("bar_base")
	finished = false
	document.getElementById("speed").textContent = speed.toFixed(2)+"倍速"
	checkbox_effect_play()
	updateLineView()
	playarea_save = document.getElementsByClassName("playarea")[0].cloneNode(true);
	if(document.getElementById("song_reset") != null){
		document.getElementById("song_reset").addEventListener("click",{name:"touch_restart", handleEvent:song_reset})
		document.getElementById("speed_change").addEventListener("click",speed_change)
		document.getElementById("more_shortcutkey").addEventListener("click",view_shortcut_key)
	}
	if(SELECTOR_ACCESS_OBJECT['flick-input']){
		SELECTOR_ACCESS_OBJECT['flick-input'] = document.getElementById("flick-input")
		document.getElementById("kashi_area").addEventListener("click",play_focus,true)
		SELECTOR_ACCESS_OBJECT['flick-input'].addEventListener("focusout",flick_blur_notification)
		SELECTOR_ACCESS_OBJECT['flick-input'].addEventListener("focus",flick_focus)
		SELECTOR_ACCESS_OBJECT['flick-input'].addEventListener("change",settimeout_delete_flick_form)
		SELECTOR_ACCESS_OBJECT['flick-input-second'] = document.getElementById("flick-input-second")
		SELECTOR_ACCESS_OBJECT['flick-input-second'].addEventListener("focusout",flick_blur_notification)
		SELECTOR_ACCESS_OBJECT['flick-input-second'].addEventListener("focus",flick_focus)
		SELECTOR_ACCESS_OBJECT['flick-input-second'].addEventListener("change",settimeout_delete_flick_form)
	}
	setTimeout(function (){

		if(OPTION_ACCESS_OBJECT['play-scroll']){
			window.scrollTo({
				top: (document.documentElement.scrollTop+CONTROLBOX_SELECTOR.getBoundingClientRect().top+CONTROLBOX_SELECTOR.clientHeight+Number(document.getElementsByName('scroll-adjustment')[0].selectedOptions[0].value)-document.documentElement.clientHeight)
			})
		}},50);
	document.getElementById("movie_cover").classList.remove('anim-box','fadein','is-animated');
	document.getElementById("movie_cover_black_layer").style.display = "none"
	setTimeout(function (){
		document.getElementById("movie_cover").classList.add('anim-box_out','fadeout','is-animated_out');

		setTimeout(function (){
			document.getElementById("movie_cover").style.display = "none"
		},700);

	},350);
}

let reset_flag = false;
let reset_number = 1
function song_reset(type){

	if(navigator.userAgent.match(/(iPhone|iPod|iPad|Android.*Mobile)/i)){
		mobile_sound_enables()
	}
	if(type != "practice"){
		createjs.Ticker.removeEventListener("tick", playheadUpdate);
		if(document.getElementById("typing-line-list-container") != null){
			document.getElementById("typing-line-list-container").remove()
			ending = false
		}
		if(typing_count >= 10){
			start_movie(); //再生数をカウントする
		}
		reset_flag = true
		if(finished){
			restore_playarea()
		}
		play_focus()
		if(typing_count){
			reset_number ++;
		}
		replace_complete_area("⟳"+reset_number)

		already_input = "";
		already_input_roma = "";

		next_char = [];
		line_input = [];
		count = 0
		seeked_count = 1

	}
	score = 0
	line_score = 0

	now_rank = 0
	escape_score = 0
	typing_count = 0
	typing_count_save = 0
	practice_typing_count = 0
	typing_count_roma_mode = 0
	typing_count_kana_mode = 0
	typing_count_flick_mode = 0
	combo = 0
	combo100 = false
	max_combo = 0
	kana_combo = 0
	roma_combo = 0

	miss_diff_kana = 0
	miss_diff_roma = 0
	typing_miss_count = 0
	miss_combo = 0

	total_latency = 0 //latencyの合計値
	escape_word_length = 0; //逃した打鍵数

	type_per_min = 0
	typing_speed = 0
	line_typingspeed = 0;
	line_typingspeed_rkpm = 0;

	past_playing_time = 0

	failer_count = 0
	complete_count = 0
	lineClearRate = 0
	logcount = logcount_save
	SELECTOR_ACCESS_OBJECT['type-speed'].textContent = "0.00";
	SELECTOR_ACCESS_OBJECT['line-speed'].textContent = "0.00打/秒";
	SELECTOR_ACCESS_OBJECT['next-kpm'].innerHTML = "&nbsp;";
	SELECTOR_ACCESS_OBJECT['kashi_roma'].innerHTML = "&nbsp;";
	SELECTOR_ACCESS_OBJECT['kashi_sub'].innerHTML = "&nbsp;";
	SELECTOR_ACCESS_OBJECT['kashi'].innerHTML = '<ruby>　<rt>　</rt></ruby>';
	SELECTOR_ACCESS_OBJECT['kashi_next'].innerHTML = '<ruby>　<rt>　</rt></ruby>'
	typinglog = []
	nothing_line_log = []
	latency_kpm_rkpm_log = Array(lyrics_array.length-1).fill([0,0,0]);
	escape_word_length_log = Array(lyrics_array.length-1).fill(["",0,0]);
	line_score_log = Array(lyrics_array.length-1).fill([0,0]);
	line_typing_count_miss_count_log = Array(lyrics_array.length-1).fill([0,0,0]);
	line_typinglog_log = Array(lyrics_array.length-1).fill([]);
	checkbox_effect_play()
	CorrectCalc()
	document.getElementById("gauge").parentNode.replaceChild(gauge_html_save,document.getElementById("gauge"));
	lineClearRateSelector = document.getElementById("lineClearRate")
	lineClearGauge80RateLessThanSelector = document.getElementById("gauge-80-rate-less-than")
	lineClearGauge80RateMoreThanSelector = document.getElementById("gauge-80-rate-more-than")
	document.getElementById("gauge").style.display = document.getElementsByName('line-clear-gauge-effect')[0].checked ? "block" : "none";
	gauge_html_save = document.getElementById("gauge").cloneNode(true);
	checkbox_effect_mod_open_play()
	update_status()
	if(title_speed){
		player.setPlaybackRate(title_speed)
	}
	setTimeout(function(){
		time_count = 0
		line_time_count = 0
		bar_base_update_count = 0
	}, 0);
	if(type != "practice"){
		player.seekTo(0);
	}
	player.playVideo()
	event.preventDefault()
}






/////////////////////////////////////////////////////////////////////////////////////////////////
/**
*@入力判定 ここから---
*/
function key_device_disabled(event){
	const tagname = document.activeElement.id == "flick-input" ? true : document.activeElement.tagName
	arrowkey(tagname);
}

function settimeout_delete_flick_form(event){
	if( next_char[0] && (next_char[0][0] == "゛" || next_char[0][0] == "゜")){
		if(daku_kana_list.includes(next_char.slice(-1)[0]) || handaku_kana_list.includes(next_char.slice(-1)[0]) ){
			if(next_char.slice(-1)[0].normalize('NFD')[0]){
				next_char[0] = next_char.slice(-1)[0]+next_char[0].slice(1)
				next_char.pop()
				typing_count--
				updateLineView_typing(true)
			}
		}else if(already_input[already_input.length-1]){
			next_char[0] = already_input.slice(-1)+next_char[0]
			already_input = already_input.slice(0,-1)
			typing_count--
			updateLineView_typing(true)
		}
	}
	event.target.value = ""
	flick_input_max_value = ""
}
function flick_blur_notification(event){
	if(player.getPlayerState() == 1){
		document.getElementsByTagName("header")[0].style.display = ""
		setTimeout(function(){
			SELECTOR_ACCESS_OBJECT['skip-guide'].textContent = ""
		},0)
		document.getElementById("tap_here").style.display = "block"
		document.getElementById("tap_here").style.opacity = "1"
	}
	if( next_char[0] && (next_char[0][0] == "゛" || next_char[0][0] == "゜")){
		if(daku_kana_list.includes(next_char.slice(-1)[0]) || handaku_kana_list.includes(next_char.slice(-1)[0]) ){
			if(next_char.slice(-1)[0].normalize('NFD')[0]){
				next_char[0] = next_char.slice(-1)[0]+next_char[0].slice(1)
				next_char.pop()
				typing_count--
				updateLineView_typing(true)
			}
		}else if(already_input[already_input.length-1]){
			next_char[0] = already_input.slice(-1)+next_char[0]
			already_input = already_input.slice(0,-1)
			typing_count--
			updateLineView_typing(true)
		}
	}
}
function flick_focus(event){
	document.getElementsByTagName("header")[0].style.display = "none"
	document.getElementById("tap_here").style.display = "none"
	event.target.setSelectionRange(event.target.value.length, event.target.value.length);

}
let line_typinglog = []
let daku_kana_list = ["ゔ","が","ぎ","ぐ","げ","ご","ざ","じ","ず","ぜ","ぞ","だ","ぢ","づ","で","ど","ば","び","ぶ","べ","ぼ"];
let handaku_kana_list = ["ぱ","ぴ","ぷ","ぺ","ぽ"];
let keys = ["Space","Digit1","Digit2","Digit3","Digit4","Digit5","Digit6","Digit7","Digit8","Digit9","Digit0","Minus","Equal","IntlYen","BracketLeft","BracketRight","Semicolon","Quote","Backslash","Backquote","IntlBackslash","Comma","Period","Slash","IntlRo"]//keys.includes(event.code)
let tenkeys = ["Numpad1","Numpad2","Numpad3","Numpad4","Numpad5","Numpad6","Numpad7","Numpad8","Numpad9","Numpad0","NumpadDivide","NumpadMultiply","NumpadSubtract","NumpadAdd","NumpadDecimal"]//tenkeys.includes(event.code)
let youon_flick_list = ["ぁ","ぃ","ぅ","ぇ","ぉ","ゃ","ゅ","ょ","っ","ゎ"]
let youon_flick_list_large = ["あ","い","う","え","お","や","ゆ","よ","つ","わ"]
let hankaku_list = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "~", "&", "%", "!", "?", "@", "#", "$", "(", ")", "|", "{", "}", "`", "*", "+", ":", ";", "_", "<", ">", "=", "^"]
let flick_input_max_value = 0

keydownfunc = function (event) {
	let tagname = event.type == "input" || document.activeElement.type == "range" ? true : document.activeElement.tagName
	if(document.activeElement.className == "caret"){tagname = "INPUT"}
	let c
	let flick_char = event.type == "input" && event.data != null ? event.data.slice(0.-1) : false
	const replay_flag = (!OPTION_ACCESS_OBJECT['replay-mode'] || stop_time_flag || OPTION_ACCESS_OBJECT['replay-mode'] && count && !line_typinglog_log[count-1][push_counter]) ? true : false
	const character_key = flick_char !== false || ((event.keyCode >= 65 && event.keyCode <= 90) || keys.includes(event.code) || tenkeys.includes(event.code)) && event.key != "Process" ? true : false
	if(replay_flag && character_key && tagname != "INPUT"  && next_char[0]){
		headtime = player.getCurrentTime() + player.difftime;
		time_calculation(false)
		if(kana_mode){

			let daku = daku_kana_list.includes(next_char[0][0]) ? daku_kana_list[daku_kana_list.indexOf(next_char[0][0])] : false
			let handaku = handaku_kana_list.includes(next_char[0][0]) ? handaku_kana_list[handaku_kana_list.indexOf(next_char[0][0])] : false
			if(event.type == "keydown"){
				kana_keymap = {
					0: function() { return ["わ"] },
					1: function() { return ["ぬ"] },
					"!": function() { return["ぬ"] },
					2: function() { return ["ふ"] },
					3: function() { return ["あ"] },
					4: function() { return ["う"] },
					5: function() { return ["え"] },
					6: function() { return ["お"] },
					7: function() { return ["や"] },
					8: function() { return ["ゆ"] },
					9: function() { return ["よ"] },
					"-": function() { return ["ほ","-"] },
					"q": function() { return ["た"] },
					"Q": function() { return ["た"] },
					"w": function() { return ["て"] },
					"W": function() { return ["て"] },
					"e": function() { return ["い"] },
					"E": function() { return ["い"] },
					"r": function() { return ["す"] },
					"R": function() { return ["す"] },
					"t": function() { return ["か"] },
					"T": function() { return ["か"] },
					"y": function() { return ["ん"] },
					"Y": function() { return ["ん"] },
					"u": function() { return ["な"] },
					"U": function() { return ["な"] },
					"i": function() { return ["に"] },
					"I": function() { return ["に"] },
					"o": function() { return ["ら"] },
					"O": function() { return ["ら"] },
					"p": function() { return ["せ"] },
					"P": function() { return ["せ"] },
					"a": function() { return ["ち"] },
					"A": function() { return ["ち"] },
					"s": function() { return ["と"] },
					"S": function() { return ["と"] },
					"d": function() { return ["し"] },
					"D": function() { return ["し"] },
					"f": function() { return ["は"] },
					"F": function() { return ["は"] },
					"g": function() { return ["き"] },
					"G": function() { return ["き"] },
					"h": function() { return ["く"] },
					"H": function() { return ["く"] },
					"j": function() { return ["ま"] },
					"J": function() { return ["ま"] },
					"k": function() { return ["の"] },
					"K": function() { return ["の"] },
					"l": function() { return ["り"] },
					"L": function() { return ["り"] },
					"z": function() { return ["つ"] },
					"Z": function() { return ["つ"] },
					"x": function() { return ["さ"] },
					"X": function() { return ["さ"] },
					"c": function() { return ["そ"] },
					"C": function() { return ["そ"] },
					"v": function() { return ["ひ"] },
					"V": function() { return ["ひ"] },
					"b": function() { return ["こ"] },
					"B": function() { return ["こ"] },
					"n": function() { return ["み"] },
					"N": function() { return ["み"] },
					"m": function() { return ["も"] },
					"M": function() { return ["も"] },
					",": function() { return ["ね",","] },
					"<": function() { return ["、"] },
					".": function() { return ["る","."] },
					">": function() { return ["。"] },
					"/": function() { return ["め","/"] },
					"?": function() { return ["・"] },
					"#": function() { return ["ぁ"] },
					"$": function() { return ["ぅ"] },
					"%": function() { return ["ぇ"] },
					"'": function() { return ["ゃ","’","'"] },
					"^": function() { return ["へ"] },
					"~": function() { return ["へ"] },
					"&": function() { return ["ぉ"] },
					"(": function() { return ["ゅ"] },
					")": function() { return ["ょ"] },
					'|': function() { return ["ー"] },
					"_": function() { return ["ろ"] },
					"=": function() { return ["ほ"] },
					"+": function() { return ["れ"] },
					";": function() { return ["れ"] },
					'"': function() { return ["ふ","”","“","\""] },
					"@": function() { return ["゛"] },
					'`': function() { return ["゛"] },
					"[": function() { return ["゜"] },
					']': function() { return ["む"] },
					"{": function() { return ["「"] },
					'}': function() { return ["」"] },
					":": function() { return ["け"] },
					"*": function() { return ["け"] }
				}
				windows_keymap = {
					'IntlYen': function() { return ["ー","￥","\\"] },
					"IntlRo": function() { return ["ろ","￥","\\"] },
					"Space": function() { return [" "] },
					"Numpad1": function() { return [] },
					"Numpad2": function() { return [] },
					"Numpad3": function() { return [] },
					"Numpad4": function() { return [] },
					"Numpad5": function() { return [] },
					"Numpad6": function() { return [] },
					"Numpad7": function() { return [] },
					"Numpad8": function() { return [] },
					"Numpad9": function() { return [] },
					"Numpad0": function() { return [] },
					"NumpadDivide": function() { return [] },
					"NumpadMultiply": function() { return [] },
					"NumpadSubtract": function() { return [] },
					"NumpadAdd": function() { return [] },
					"NumpadDecimal": function() { return [] }
				}
				c = windows_keymap[event.code] ? windows_keymap[event.code]() : kana_keymap[event.key]();
				if(event.shiftKey){
					if(event.code == "KeyE"){c[0] = "ぃ";}
					if(event.code == "KeyZ"){c[0] = "っ";}

					//ATOK入力 https://support.justsystems.com/faq/1032/app/servlet/qadoc?QID=024273
					if(event.code == "KeyV"){c.push("ゐ","ヰ")}
					if(event.code == "Equal"){c.push("ゑ","ヱ")}
					if(event.code == "KeyT"){c.push("ヵ")}
					if(event.code == "Quote"){c.push("ヶ")}
					if(event.code == "KeyF"){c.push("ゎ")}
				}
				if(hankaku_list.includes(event.key)){
					!OPTION_ACCESS_OBJECT['case-sensitive-mode'] ? c.push(event.key.toLowerCase() , event.key.toLowerCase().replace(event.key.toLowerCase(), function(s) {return String.fromCharCode(s.charCodeAt(0) + 0xFEE0);})) : c.push(event.key , event.key.replace(event.key, function(s) {return String.fromCharCode(s.charCodeAt(0) + 0xFEE0);}))
				}
				if(event.shiftKey && event.key === "0"){c = ["を"];}
			}else{
				if(flick_input_max_value == event.target.value){
					return;
				}
				if(flick_input_max_value.length > event.target.value.length){
					flick_input_max_value = event.target.value
					if( next_char[0] && (next_char[0][0] == "゛" || next_char[0][0] == "゜")){
						if(daku_kana_list.includes(next_char.slice(-1)[0]) || handaku_kana_list.includes(next_char.slice(-1)[0]) ){
							if(next_char.slice(-1)[0].normalize('NFD')[0]){
								next_char[0] = next_char.slice(-1)[0]+next_char[0].slice(1)
								next_char.pop()
								typing_count--
								updateLineView_typing(true)
							}
						}else if(already_input[already_input.length-1]){
							next_char[0] = already_input.slice(-1)+next_char[0]
							already_input = already_input.slice(0,-1)
							typing_count--
							updateLineView_typing(true)
						}
					}
					return;
				}
				flick_input_max_value = event.target.value
				c = [flick_char]
				if(c[0] == "~" || c[0] == "～"){
					c = ["~","～"]
				}
				if(c[0] == "\\" || c[0] == "￥"){
					c = ["\\","￥"]
				}
				if(c[0] == "　"){
					c = [" "]
				}
				if(c[0] == "！" || c[0] == "!"){
					c = ["!","！"]
				}
				if(c[0] == "？" || c[0] == "?"){
					c = ["?","？"]
				}
				if(next_char[0][0] == "゛" && daku_kana_list.includes(c[0]) || next_char[0][0] == "゜" && handaku_kana_list.includes(c[0])){
					if(c[0].normalize('NFD')[0] == already_input.slice(-1)||c[0] == next_char.slice(-1)[0]){
						c = [next_char[0][0]]
					}
				}
				const zenkaku = hankaku_list.indexOf(c[0])
				if(zenkaku > -1){
					c.push(c[0].replace(c[0], function(s) {return String.fromCharCode(s.charCodeAt(0) + 0xFEE0)}));
				}else if(c[0] == "\\"){
					c.push("￥")
				}else if(c[0] == "\""){
					c.push("“","”")
				}else if(c[0] == "'"){
					c.push("’")
				}


			}

			if(checkNextKana(c,daku,handaku,flick_char)){
				if(daku || handaku){
					c = daku ? daku.normalize('NFD')[0] : handaku.normalize('NFD')[0]
				}else{
					c = c[kana_key_objects]
				}
				Continuous_xtu_flag = false // ローマ字モードの「っ」連鎖判定
				add_typing_count(c);
				type_effect();
			} else if(!completed && (!flick_char || flick_char && ( !(youon_flick_list.includes(next_char[0][0]) && youon_flick_list_large.indexOf(c[0]) == youon_flick_list.indexOf(next_char[0][0])) && !(youon_flick_list.includes(c[0]) && next_char[0][0] == "゛") && !(daku_kana_list.includes(c[0]) && next_char[0][0] == "゜") ) )) {
				if(already_input.length != 0 || daku_kana_list.includes(next_char.slice(-1)[0]) || handaku_kana_list.includes(next_char.slice(-1)[0])) {
					if(flick_char && (next_char[0][0] == "゛" && c[0] != "゛"||next_char[0][0] == "゜" && c[0] != "゜") ){
						if(daku_kana_list.includes(next_char.slice(-1)[0]) || handaku_kana_list.includes(next_char.slice(-1)[0]) ){
							if(next_char.slice(-1)[0].normalize('NFD')[0] != c[0] ){
								next_char[0] = next_char.slice(-1)[0]+next_char[0].slice(1)
								next_char.pop()
								typing_count--
								updateLineView_typing(true)
							}
						}else if(already_input[already_input.length-1] != c[0]){
							next_char[0] = already_input.slice(-1)+next_char[0]
							already_input = already_input.slice(0,-1)
							typing_count--
							updateLineView_typing(true)
						}
					}
					if(!flick_char && /[!-~]/.test(next_char[0])){
						typinglog.push([headtime, event.key, Math.round(score-score_per_char/4), count, 0, 0]);
						line_typinglog.push([event.key , 0 , headtime, kana_mode]);
					}else{
						typinglog.push([headtime, c[0], Math.round(score-score_per_char/4), count, 0, 0]);
						line_typinglog.push([c[0] , 0 , headtime, kana_mode]);
					}
					add_typing_miss_count();
				}
				miss_effect();
				if(perfect_mode_judge(true)){return;}

			}


		}else{
			c = OPTION_ACCESS_OBJECT['case-sensitive-mode'] && /[A-Za-zＡ-Ｚａ-ｚ]/.test(next_char[0]) ? event.key:(event.key).toLowerCase()


			if(checkNextChar(c,z_command_roma_mode(c,event.code,event.shiftKey))){
				add_typing_count(c);

				type_effect();

			}else if(!completed) {
				if(already_input_roma.length != 0) {
					add_typing_miss_count();
					typinglog.push([headtime, c, Math.round(score), count,0,0]);
					line_typinglog.push([c , 0 , headtime, kana_mode]);
				}
				miss_effect();
				if(perfect_mode_judge(true)){return;}
			}


		}

		if(event.type == "keydown" && !(event.ctrlKey && event.code == "KeyC")){
			auto_scroll_flag = true
			event.preventDefault()
			return;
		}
	}
	if(tagname != "INPUT" && event.type == "keydown"){
		arrowkey(tagname);
	}
}

let line_score = 0
let Continuous_xtu_flag = false
let n_flag = false
checkNextChar=function (c,z_command){
	let flag = false;
	let next_char_roma = next_char.slice(1)
	let kana_update_flag = z_command ? true : false
	let space_disable_space = ""
	//入力したキー == 打鍵パターン1文字目  確認
	for (let i=0; i<next_char_roma.length; i++){
		if(c == next_char_roma[i][0]){
			flag = true;
			break;}
	}


	//一致してなかったら中断
	if(Continuous_xtu_flag && c =="t"){
		continuous_xtu_adjust(c)
	}else if(tsu_flag && c =="s"){
		already_input_roma += c
		updateLineView_typing(kana_update_flag)
		return true;
	}else if(n_flag && line_input_kana[0][0] == "う" && c =="w"){
		add_next_char(true)
		updateLineView_typing(true)
	}else if(next_char[0] == "..." && c==","){
		next_char = ["..", ","]
		next_point = 2 * score_per_char
		line_input.unshift(".")
		line_input_roma.unshift(".")
		line_input_kana.unshift(".")
	}else if(!flag){
		return false;
	}

	Continuous_xtu_flag = false
	n_flag = false

	//xnで「ん」を入力する場合は[nn]のパターンを削除
	//nnの入力中にwu,whu,yi,yeの判定を追加。
	if(next_char[0]=='ん'){
		if(c=='x' && line_input_roma[0] && line_input_roma[0][0]!='n'){
			line_input[0] = line_input[0].filter(function(value) { return value.match(/^(?!(n)).*$/)})
		}else if(line_input_kana[0] && line_input_kana[0][0] == "う" && c=='n' && next_char[1]=='nn'){
			n_flag = true
		}
	}
	//打ってない方のパターン削除
	if(next_char.length >= 3){
		//拗音・促音クリア判定
		//先頭の文字(現在入力してるモノ)を削除
		for (let j=0; j<next_char.length; j++){
			if(j > 0){
				if(c==next_char[j][0]){
					next_char[j] = next_char[j].slice(1);
				}else{
					//入力したキーから始まる打鍵パターン以外を削除
					next_char.splice( j, 1 );
					j--
				}
			}
		}
	}else{
		next_char[1] = next_char[1].slice(1)
	}


	if(next_char[0].length >= 2){
		if(next_char[0][0] != 'っ' && (next_char[1][0] == 'x' || next_char[1][0] == 'l') || next_char[0][0] == 'っ' && (c == 'u' || next_char[1][0] == c)){
			if(next_char[0][0] == 'っ' && next_char[0][1] == 'っ' && (next_char[1][0] == 'x' || next_char[1][0] == 'l') && (c == "x"||c == "l")){
				Continuous_xtu_flag = true
			}
			roma_distinguish()
			kana_update_flag = true
			if(next_char[0][0] == 'っ' && c == 'u'){
				tsu_flag = false
			}
		}
	}


	space_disable_space = !space_disable && next_char[0][next_char[0].length-1] == " " ? " " : ""
	already_input_roma += c+space_disable_space;
	if(!next_char[1]) {
		add_next_char(true)
		kana_update_flag = true
	}

	updateLineView_typing(kana_update_flag)

	return true;
}

let tsu_flag = false
function continuous_xtu_adjust(c){

	const xtu_times = ( xtu_chain[0].match( /っ/g ) || [] ).length-( next_char[0].match( /っ/g ) || [] ).length
	if(Continuous_xtu_flag){
		next_char[0] = already_input.slice(-1)+next_char[0]
		already_input = already_input.slice(0,-1)
		tsu_flag = true
	}
	for(let h=1;h<xtu_chain.length;h++){
		next_char[h] = (Continuous_xtu_flag?"tu":"")+xtu_chain[h].slice(xtu_times)
	}
	if(Continuous_xtu_flag){updateLineView_typing(true)}
}

function z_command_roma_mode(c,pushkey,shiftkey,replay_judge){
	if(replay_judge){ pushkey = "KeyZ" }
	if(pushkey == "KeyZ" && !shiftkey){
		if(next_char[0] == "." && line_input_kana[0] == "."){
			if(line_input_kana[1] == "."){
				next_char = ["...", c+"."]
				next_point = 3 * score_per_char
				line_input.splice(0, 2)
				line_input_roma.splice(0, 2)
				line_input_kana.splice(0, 2)
			}else{
				next_char = ["..", c+","]
				next_point = 2 * score_per_char
				line_input.splice(0, 1)
				line_input_roma.splice(0, 1)
				line_input_kana.splice(0, 1)
			}
			return true
		}else if(next_char[0] == "～" && next_char[1] != "-"){
			next_char[1] = c+"-"
		}
	}
}
function roma_distinguish(){
	already_input += kana_mode && !OPTION_ACCESS_OBJECT['dakuten-handakuten-split-mode'] && ["゛", "゜"].includes(next_char[0][0]) ? next_char[next_char.length-1] : next_char[0].slice( 0, 1 )
	next_char[0] = next_char[0].slice(1)
}


var kana_key_objects = 0;
let daku_kana_flag = false
checkNextKana = function (c,daku,handaku,flick_flag){
	let yoon = ""
	if(next_char[0].length >= 2){
		kana_key_objects = [].indexOf.call(c, !OPTION_ACCESS_OBJECT['case-sensitive-mode'] ? next_char[0][0].toLowerCase(): next_char[0][0])
		if(daku || handaku){
			yoon = next_char[0][1]
		}
	}else{
		kana_key_objects = [].indexOf.call(c, !OPTION_ACCESS_OBJECT['case-sensitive-mode'] ? next_char[0].toLowerCase(): next_char[0])
	}

	if(daku_kana_flag && c[kana_key_objects] && (next_char[0][0] == "゛" || next_char[0][0] == "゜")){
		kana_combo --
		daku_kana_flag = false
	}

	if(flick_flag){
		if(OPTION_ACCESS_OBJECT['dakuten-handakuten-split-mode'] && c[0] && next_char[0].length >= 2){
			const boin = (daku_kana_list.includes(c[0]) || handaku_kana_list.includes(c[0])) ? c[0] : false
			if(boin && next_char[0][0] == boin.normalize('NFD')[0] && ( (next_char[0][1] == "゛" && daku_kana_list.includes(c[0])) || (next_char[0][1] == "゜" || handaku_kana_list.includes(c[0])) ) ){
				add_next_char(true)
				updateLineView_typing(true)
				return true
			}
		}
	}
	//return trueは正解　return falseは不正解。
	if(daku && c.includes(daku.normalize('NFD')[0])) {
		next_char = ["゛"+yoon, ...next_char.slice(1),daku];
		updateLineView_typing(true)
		kana_combo ++
		daku_kana_flag = true
		return true;
	}else if (handaku && c.includes(handaku.normalize('NFD')[0])) {
		next_char = ["゜"+yoon, ...next_char.slice(1),handaku];
		updateLineView_typing(true)
		kana_combo ++
		daku_kana_flag = true
		return true;
	}else if(kana_key_objects > -1) {
		if(next_char[0].length >= 2 && next_char[0][1] != " "){
			roma_distinguish()
		}else{
			add_next_char(true)
		}
		updateLineView_typing(true)
		return true
	}


	return false;
}

let xtu_chain = ""
function add_next_char(flag){
	if(flag){
		already_input += kana_mode && !OPTION_ACCESS_OBJECT['dakuten-handakuten-split-mode'] && ["゛", "゜"].includes(next_char[0]) ? next_char[next_char.length-1] : next_char[0];
		//スコア加算
		if(play_speed<DefaultPlaySpeed){
			line_score += next_point*play_speed;
			if(OPTION_ACCESS_OBJECT['replay-mode'] || line_score_log[count-1][0] < line_score){
				SELECTOR_ACCESS_OBJECT['score-value'].textContent = ((score + line_score)/2000).toFixed(2)
			}
		}else{
			line_score += next_point;
		}
		if(play_mode == "normal" && play_speed>=1 || play_mode == "practice" && play_speed >= DefaultPlaySpeed && (OPTION_ACCESS_OBJECT['replay-mode'] || line_score_log[count-1][0] < line_score) || title_speed){
			score += next_point;
			SELECTOR_ACCESS_OBJECT['score-value'].textContent = (score/2000).toFixed(2)
		}
	}

	if(kana_mode && flag && next_char.length >= 2 && next_char[0].length == 1){
		already_input_roma += next_char[1]
		line_input_roma.shift(1)
	}else if(!kana_mode || !flag){
		line_input_roma.shift(1)
	}
	xtu_chain = ""
	next_char = !line_input[0] ? ["",""] : [line_input_kana.shift(1), ...line_input.shift(1)]
	if(next_char[0][0] == "っ" && next_char[0][1] == "っ"){xtu_chain = next_char.concat()}
	if(OPTION_ACCESS_OBJECT['case-sensitive-mode'] && next_char[0] == next_char[1].toUpperCase()){ next_char[1] = next_char[1].toUpperCase() }

	if(!next_char[0]) {
		line_completed()
	}else{
		next_point = next_char[1].length * score_per_char
		if(!kana_mode){ keystroke_pattern_optimisation() }
	}

}



let line_move_flag = false
//タイピング時のショートカットキー
function arrowkey(tagname){

	switch(event.key){
		case "ArrowDown":
			if(event.shiftKey){
				skip = false;
				update_skip();
				event.preventDefault();
				return;
			}else{

				if(OPTION_ACCESS_OBJECT['disable-up-down-shortcut']){
					event.preventDefault();
					return;
				}
				volume = player.getVolume();
				volume -= 10;
			}
			if(volume < 0) {volume = 0;}
			player.setVolume(volume);
			localStorage.setItem('volume_storage', volume);
			document.getElementById("volume").textContent = volume;
			document.getElementById("volume_control").value = volume
			replace_complete_area("音量: "+volume+"%")
			event.preventDefault();
			break;
		case "ArrowUp":
			if(event.shiftKey){
				skip = 2;
				update_skip();
				event.preventDefault();
				return;
			}else{

				if(OPTION_ACCESS_OBJECT['disable-up-down-shortcut']){
					event.preventDefault();
					return;
				}
				volume = player.getVolume();
				volume += 10;
			}
			if(volume > 100) {volume = 100;}
			player.setVolume(volume);
			localStorage.setItem('volume_storage', volume);
			document.getElementById("volume").textContent = volume;
			document.getElementById("volume_control").value = volume
			replace_complete_area("音量: "+volume+"%")
			event.preventDefault();
			break;
		case "ArrowLeft" :
			if(!event.altKey){
				if(event.ctrlKey && event.shiftKey){
					player.difftime -= 0.01
				}else if(play_mode == "practice" && event.ctrlKey) {
					if(!seek_line_flag){
						line_move_flag = true
					}
					n = seek_line_flag || count == logcount ? -1 : -2

					if(last_seek_line_count == count){
						n++;
					}
					let count_adjust = line_move_flag && count > logcount ? count + 1 : count
					let clone
					while ( document.querySelector('[number="'+(count_adjust+n)+'"]') == null && (count_adjust+n) >= logcount) {n--;}
					if(count_adjust < logcount){return;}
					if(count_adjust > logcount){
						last_seek_time = document.querySelector('[number="'+(count_adjust+n)+'"]').getAttribute('value') - (count_adjust+n > 0 ? 1 : 0)
						last_seek_line_count = Number(document.querySelector('[number="'+(count_adjust+n)+'"]').getAttribute('number')) - (count_adjust+n > 0 ? 1 : 0)
						clone = document.querySelector('[number="'+(last_seek_line_count+(count_adjust+n > 0 ? 1 : 0))+'"]').cloneNode(true)
					}else{
						last_seek_time = document.querySelector("#typing-line-result [number]").getAttribute('value')-1
						last_seek_line_count = Number(document.querySelector("#typing-line-result [number]").getAttribute('number')) - (logcount-1?1:0)
						clone = document.querySelector("#typing-line-result [number]").cloneNode(true)
					}
					seek_line_set(clone)
					seek_practice_line(last_seek_time,last_seek_line_count)
					replace_complete_area("◁")
					time_count = 0
					bar_base_update_count = 0
					count_adjust = line_move_flag ? count : count

					add_line_typingword(count_adjust)
					if(line_input.length > 0){ add_next_char(false) }
					updateLineView_typing(true)
					next_typing_kashi_check(count_adjust+1)
					line_move_flag = false
					event.preventDefault();
					break;
				}else{

					if(OPTION_ACCESS_OBJECT['disable-left-right-shortcut']){
						event.preventDefault();
						return;
					}
					player.difftime -= 0.1
				}
				if(player.difftime < -4.0) {player.difftime = -4.0;}
				player.difftime = Math.round(player.difftime* 100)/100
				document.getElementById("time_diff").textContent = player.difftime.toFixed(2);
				replace_complete_area(`時間調整　`+player.difftime.toFixed(2))
			}
			event.preventDefault();
			break;
		case"ArrowRight":
			if(!event.altKey){
				if(event.ctrlKey && event.shiftKey){
					player.difftime += 0.01
				}else if(play_mode == "practice" && event.ctrlKey){
					n = seek_line_flag || count - logcount == -1 ? 1 : 0
					if(last_seek_line_count == count){
						n++;
					}
					while ( document.querySelector('[number="'+(count+n)+'"]') == null && lyrics_array.length-1 > (count+n)) {n++;}
					if(lyrics_array.length-2 < (count+n)){return;}
					let clone
					if(count>=logcount || seek_line_flag){
						last_seek_time = document.querySelector('[number="'+(count+n)+'"]').getAttribute('value')-1
						last_seek_line_count = Number(document.querySelector('[number="'+(count+n)+'"]').getAttribute('number'))-1
						clone = document.querySelector('[number="'+(last_seek_line_count+1)+'"]').cloneNode(true)
					}else{
						last_seek_time = document.querySelector("#typing-line-result [number]").getAttribute('value')-1
						last_seek_line_count = Number(document.querySelector("#typing-line-result [number]").getAttribute('number'))-1
						clone = document.querySelector("#typing-line-result [number]").cloneNode(true)
					}
					seek_line_set(clone)
					seek_practice_line(last_seek_time,last_seek_line_count)
					replace_complete_area("▷")
					add_line_typingword(count)
					if(line_input.length > 0){ add_next_char(false) }
					updateLineView_typing(true)
					next_typing_kashi_check(count+1)
					event.preventDefault();
					break;
				}else{

					if(OPTION_ACCESS_OBJECT['disable-left-right-shortcut']){
						event.preventDefault();
						return;
					}
					player.difftime += 0.1
				}
				if(player.difftime > 4.0) {player.difftime = 4.0;}
				player.difftime = Math.round(player.difftime* 100)/100
				document.getElementById("time_diff").textContent = player.difftime.toFixed(2);
				replace_complete_area(`時間調整　`+player.difftime.toFixed(2))			}
			event.preventDefault();
			break;
		case "F4": //F4でやり直し
			(play_mode == "normal" ? song_reset:practice_retry)();
			event.preventDefault();
			break;
		case "F7": //F7で練習モードに切り替え
			if(play_mode == "normal"){
				if(document.getElementById("typing-line-list-container") != null){document.getElementById("typing-line-list-container").remove()}
				move_practice_mode()
			}
			event.preventDefault();
			break;
		case "F9": //F9で低速(練習モード)
			if(play_mode=="practice"){
				play_speed_down()
				replace_complete_area("x"+speed.toFixed(2))
			}
			event.preventDefault();
			break;
		case "F10" ://F10で倍速
			if(play_mode=="normal"){
				speedup();
			}else{
				play_speed_up()
				replace_complete_area("x"+speed.toFixed(2))
			}
			event.preventDefault();
			break;
		case "Escape" : //Escでポーズ
			player.pauseVideo()
			event.preventDefault();
			break;
		case "KanaMode" :
		case "Romaji" :
			if(keyboard != "mac" && !OPTION_ACCESS_OBJECT['disable-change-mode']){
				input_mode_change()
				event.preventDefault();
				break;
			}
	}
	if(event.code == skip_code && (SELECTOR_ACCESS_OBJECT['skip-guide'].textContent.includes(skip_code) || SELECTOR_ACCESS_OBJECT['skip-guide'].textContent.includes("Tap")) ){
		press_skip()
		if(keyboard != "mac"){
			event.preventDefault();
		}
	}
	if(event.altKey && (event.key == "ArrowLeft" || event.key == "ArrowRight")) {
		return;
	}else if(tagname != "INPUT" && (event.code=="CapsLock" || event.code=="Backquote" || event.key=="Tab" || event.key=="F3" || event.altKey || (event.code=="Space"&& keyboard != "mac") || event.code=="Backspace" || window.navigator.userAgent.indexOf('Firefox') != -1 && (event.key=="'" || event.key=="/")) ) {
		event.preventDefault();
		return;
	}
}


update_skip = function () {
	if (skip === false) {
		if(document.getElementById("skip") != null){
			document.getElementById("skip").remove()
		}
	} else {
		if(document.getElementById("skip") == null){
			document.getElementById("time_adjust").insertAdjacentHTML('afterend', `<div style="transform: scale(0.8,0.8);opacity:0.8;" id="skip" class="control_option time_adjust_head" >自動スキップON</div>`)
		}
	}
}

function input_mode_change(){
	if(kana_mode){
		kana_mode = false
		notes_list = roma_notes_list
		line_difficulty_data = line_difficulty_data_roma
		typing_count = typing_count_save+already_input_roma.length
		kanaModeConfig.style.display = "none"
		if(next_char[0]){
			if(OPTION_ACCESS_OBJECT['dakuten-handakuten-split-mode']){
				line_input_kana = daku_handaku_join(true,false,line_input_kana)
			}else if(next_char[0] == "゜" || next_char[0] == "゛"){
				next_char[0] = next_char[next_char.length-1]
			}

			if(!xtu_chain){
				for (let i=0; i<romaMap.length; i++){
					if(next_char[0] == romaMap[i][0]){
						next_char = [romaMap[i][0],...romaMap[i].slice(1)]
					}
				}
			}else{
				continuous_xtu_adjust()
			}

		}
		if(mode_select == "roma_type" || document.getElementsByName('from-kana-mode-change')[0].selectedOptions[0].value == "from-roma-display"){
			mode = "roma"
		}
		checkbox_effect_play()
		updateLineView()
		updateLineView_typing(true)
		replace_complete_area("Romaji")
	}else{
		kana_mode = true
		notes_list = kana_notes_list
		line_difficulty_data = line_difficulty_data_kana
		typing_count = typing_count_save+already_input.length
		kanaModeConfig.style.display = "block"
		const next_char_convert_target = kana_mode_convert_rule_before.indexOf(next_char[0])
		if(next_char_convert_target >= 0){
			next_char[0] = kana_mode_convert_rule_after[next_char_convert_target]
		}
		if(/←|↓|↑|→|『|』/.test(line_input_kana.join(""))){
			for(h=0;h<line_input_kana.length;h++){
				const convert_target = kana_mode_convert_rule_before.indexOf(line_input_kana[h])
				if(convert_target >= 0){
					line_input_kana[h] = kana_mode_convert_rule_after[convert_target]
				}
			}
		}
		if(next_char[0] && OPTION_ACCESS_OBJECT['dakuten-handakuten-split-mode']){
			line_input_kana = daku_handaku_join(true,false,line_input_kana)
		}

		if(mode_select == "roma_type" || document.getElementsByName('from-kana-mode-change')[0].selectedOptions[0].value == "from-roma-display"){
			mode = "kana"
		}
		checkbox_effect_play()
		updateLineView()
		updateLineView_typing(true)
		replace_complete_area("KanaMode")
	}
	next_typing_kashi_check(count)
	map_info_generator()

}



function daku_handaku_join(next_char_flag,Calculation,join_word){
	let tagstr1 = {
		"ゔ": "う゛","が": "か゛", "ぎ": "き゛", "ぐ": "く゛", "げ": "け゛", "ご": "こ゛",
		"ざ": "さ゛", "じ": "し゛", "ず": "す゛", "ぜ": "せ゛", "ぞ": "そ゛",
		"だ": "た゛", "ぢ": "ち゛", "づ": "つ゛", "で": "て゛", "ど": "と゛",
		"ば": "は゛", "び": "ひ゛", "ぶ": "ふ゛", "べ": "へ゛", "ぼ": "ほ゛",
		"ぱ": "は゜", "ぴ": "ひ゜", "ぷ": "ふ゜", "ぺ": "へ゜", "ぽ": "ほ゜",
	};
	let tagstr2 = {}; Object.keys(tagstr1).map(function (v, index, array) { return tagstr2[tagstr1[v]] = v }); // keyとvalueを逆にする
	let s1 = "ゔ|が|ぎ|ぐ|げ|ご|ざ|じ|ず|ぜ|ぞ|だ|ぢ|づ|で|ど|ば|び|ぶ|べ|ぼ|ぱ|ぴ|ぷ|ぺ|ぽ";
	let s2 = "う゛|か゛|き゛|く゛|け゛|こ゛|さ゛|し゛|す゛|せ゛|そ゛|た゛|ち゛|つ゛|て゛|と゛|は゛|ひ゛|ふ゛|へ゛|ほ゛|は゜|ひ゜|ふ゜|へ゜|ほ゜";
	let reg, replacer;
	if((!kana_mode || !OPTION_ACCESS_OBJECT['dakuten-handakuten-split-mode']) && !Calculation){
		function replacer2(match, index, input) { // 「か゛」 → 「が」
			return tagstr2[match]
		}
		reg = new RegExp(s2, "g"); replacer = replacer2;
		if(next_char_flag){
			next_char[0] = next_char[0].replace(reg, replacer);
		}
		for(let i=0 ; join_word.length > i ; i++){
			join_word[i] = join_word[i].replace(reg, replacer);
		}
	}else if(OPTION_ACCESS_OBJECT['dakuten-handakuten-split-mode'] || Calculation){
		function replacer1(match, index, input) { // 「が」 → 「か゛」
			return tagstr1[match]
		}
		reg = new RegExp(s1, "g"); replacer = replacer1;
		if(next_char_flag){
			next_char[0] = next_char[0].replace(reg, replacer);
		}
		for(let i=0 ; join_word.length > i ; i++){
			join_word[i] = join_word[i].replace(reg, replacer);
		}
	}
	return join_word;
}



/////////////////////////////////////////////////////////////////////////////////////////////////
/**
*@動画スピード変更 ここから---
*/


function map_info_generator(){
	const average = kana_mode ? (median_kana_speed*speed).toFixed(2) : (median_roma_speed*speed).toFixed(2)
	const Difficult = kana_mode ? (max_kana_speed*speed).toFixed(2) : (max_roma_speed*speed).toFixed(2)
	total_notes = kana_mode ? total_notes_kana_mode : total_notes_roma_mode
	const roma_mode_if_combo = 700
	const another_mode_combo_challenge = kana_mode ? ("只今のローマ字入力モード推定ノーミス記録「"+localStorage.getItem('combo_challenge_roma')+"打鍵」"):("只今のかな入力モード推定ノーミス記録「"+localStorage.getItem('combo_challenge_kana')+"打鍵」")
	combo_challenge_html = (+localStorage.getItem('combo_challenge_roma') >= roma_mode_if_combo ? "　<span id='max_record_label'></span><span id='last_record'></span><span title='只今のTypingTube上での0miss継続打数です。\n継続ノーミスコンボがローマ字換算で700comboを超えると表示されます。\nエスケープした文字(escカウント)は参照しません。練習モードでのミス打鍵はカウントしません。\n継続打数の更新は曲終了時の\"Typing Result\"が表示された時に更新されます。\n\nコンボ継続チャレンジをせずにプレイしたい時やスピード重視でプレイする時は右のチェックボックスを外してください。\nOFFにすると継続ノーミス記録が更新されなくなり、ミスしてもノーミス記録は維持されます。\n\n"+another_mode_combo_challenge+"' class='help_pointer' id='combo_challenge'>只今の継続ノーミス記録「"+(kana_mode ? localStorage.getItem('combo_challenge_kana') : localStorage.getItem('combo_challenge_roma'))+"打鍵, "+localStorage.getItem('combo_challenge_fullcombo')+"曲目」</span><input title='コンボ継続チャレンジをせずにプレイしたい時やスピード重視でプレイする時はこちらのチェックボックスを外してください。\nOFFにすると継続ノーミス記録が伸びなくなり、ミスしてもノーミス記録は維持されます' type='checkbox' name='challenge-enable' "+(localStorage.getItem('challenge-enable') != "false" ? "checked":"")+">　":"　<span id='max_record_label'></span><span id='last_record'></span>")
	let combo_challenge_record = ""
	let combo_challenge_last_time = ""
	if(localStorage.getItem("combo_challenge_beatmap_data_max") && localStorage.getItem("combo_challenge_beatmap_data_max") != "null"){
		combo_challenge_record = `<span class="cursor-pointer"> <i id="max_record" class="cursor-pointer fas fa-chess-queen"></i> </span>`
	}
	if(localStorage.getItem("combo_challenge_beatmap_data_last") && localStorage.getItem("combo_challenge_beatmap_data_last") != "null"){
		combo_challenge_last_time = `<span id="last_record" class="cursor-pointer"> <i  class=" far fa-caret-square-left"></i> </span>`
	}
	const KigouDisableDisplay = document.getElementsByName('space-symbol-omit')[0].checked === true && abridgement_word_length > 0 ? '<span title="省略設定詳細">(省略文字数:'+abridgement_word_length+', 最大点数:'+((score_per_char * ((total_notes_roma_mode+abridgement_word_length)-abridgement_word_length))/2000).toFixed(2)+')</span>' : ""

	const KigouLength = symbolLength()
	const SymbolList = `<div id="SymbolList" class="short_popup" style="color: #FFF;padding: 1.5rem;font-size:initial;height: 183px;">
						<h5>登場記号一覧</h5>
						${KigouLength[1]}
						</div>`

		document.querySelector("#difficult > span").innerHTML =
		`<span title="打鍵数"><i class="fas fa-drum" style="backgroundcolor=:#441188; border-radius: 16px;"></i> ${total_notes}打${KigouLength[0] > 0 ? `<span id="symbolLength" class="hover_underline">(記号の数: ${KigouLength[0]})</span>`+SymbolList:""}</span>
		 <span title="ライン数"><i class="fas fa-scroll" style=""></i>${line_length}ライン</span><span title="長さ"><i class="far fa-clock" style=""></i>${movie_mm}:${movie_ss}</span>
		 <span title="必要入力スピード"><i class="fas fa-tachometer-alt" style=""></i>中央値${average}打/秒 | 最高${Difficult}打/秒</span>`+KigouDisableDisplay+combo_challenge_record+combo_challenge_last_time+combo_challenge_html

	if(document.getElementById("combo_challenge") != null){
		document.getElementById("combo_challenge").addEventListener('click', {name:"now", data: JSON.parse(localStorage.getItem("combo_challenge_beatmap_data")), handleEvent: details_generator});
		document.getElementsByName('challenge-enable')[0].addEventListener('change', saveModOption);
	}
	if(document.getElementById("symbolLength") != null){
		document.getElementById("symbolLength").addEventListener("mouseover",function(){
			document.getElementById("SymbolList").style.display = "block";
			document.getElementById("SymbolList").parentNode.title = ""

		})
		document.getElementById("symbolLength").addEventListener("mouseout",function(){
			document.getElementById("SymbolList").style.display = "none";
			document.getElementById("SymbolList").parentNode.title = "打鍵数"
		})
	}
	if(localStorage.getItem("combo_challenge_beatmap_data_max") && localStorage.getItem("combo_challenge_beatmap_data_max") != "null"){
		document.getElementById("max_record").addEventListener('mouseover', hover_max_combo_record);
		document.getElementById("max_record").addEventListener('mouseout', out_max_combo_record);
		document.getElementById("max_record").addEventListener('click', {name:"max",data: JSON.parse(localStorage.getItem("combo_challenge_beatmap_data_max")), handleEvent: details_generator});
	}
	if(localStorage.getItem("combo_challenge_beatmap_data_last") && localStorage.getItem("combo_challenge_beatmap_data_last") != "null"){
		document.getElementById("last_record").addEventListener('mouseover', hover_max_combo_record);
		document.getElementById("last_record").addEventListener('mouseout', out_max_combo_record);
		document.getElementById("last_record").addEventListener('click', {name:"last", data:JSON.parse(localStorage.getItem("combo_challenge_beatmap_data_last")), handleEvent: details_generator});

	}
}

function symbolLength(){
	let SymbolEntries = ""
	const SumSymbol = Object.values(symbol_count).reduce(function(sum, element){
		return sum + element;
	}, 0);
	if(SumSymbol){
	symbol_count = Object.keys(symbol_count).map((k)=>({ key: k, value: symbol_count[k] }));
	symbol_count.sort((a, b) => b.value - a.value);
//配列⇒オブジェクト　で元に戻す
	symbol_count = Object.assign({}, ...symbol_count.map((item) => ({
		[item.key]: item.value,
	})));


		const Entries = Object.entries(symbol_count)
		for(let i=0;i<Entries.length;i++){
			let S = Entries[i][0]
			if(i % 4 == 0){
				SymbolEntries += `${i != 0 ? "</div>":""}<div class="SymbolColumn">`
			}
			if(S == " "){
				S = "スペース"
			}
			SymbolEntries += `<div class="EntrySymbol">
							  <span class="AppearanceSymbol">${S}</span> : <span class="AppearanceTimes">${Entries[i][1]}打</span>
					          </div>`
		}
		SymbolEntries += "</div>"
	}

	return [SumSymbol,SymbolEntries];

}

function out_max_combo_record(){
	if(document.getElementById("combo_challenge") != null){
		document.getElementById("combo_challenge").style.display = "inline"
	}
	if(document.getElementById("max_record_label") != null){
		document.getElementById("max_record_label").textContent = ""
	}
}

function hover_max_combo_record(event){
	if(document.getElementById("combo_challenge") != null){
		document.getElementById("combo_challenge").style.display = "none"
	}
	let mode_record = ""
	if(event.target.id == "max_record"){
		if(kana_mode){
			mode_record = "最大コンボ「"+localStorage.getItem('combo_challenge_max_kana')+"打鍵, "+ localStorage.getItem('combo_challenge_fullcombo_max')+`曲」`+" <span style='font-size:50%'>（ローマ字単位 "+localStorage.getItem('combo_challenge_max_roma')+"打鍵）</span>"
		}else{
			mode_record = "最大コンボ「"+localStorage.getItem('combo_challenge_max_roma')+"打鍵, "+ localStorage.getItem('combo_challenge_fullcombo_max')+`曲」`+" <span style='font-size:50%'>（かな単位 "+localStorage.getItem('combo_challenge_max_kana')+"打鍵）</span>"
		}
	}else{
		if(kana_mode){
			mode_record = "前回のコンボ数「"+localStorage.getItem('combo_challenge_last_kana')+"打鍵, "+ localStorage.getItem('combo_challenge_fullcombo_last')+`曲」`+" <span style='font-size:50%'>（ローマ字単位 "+localStorage.getItem('combo_challenge_last_roma')+"打鍵）</span>"
		}else{
			mode_record = "前回のコンボ数「"+localStorage.getItem('combo_challenge_last_roma')+"打鍵, "+ localStorage.getItem('combo_challenge_fullcombo_last')+`曲」`+" <span style='font-size:50%'>（かな単位 "+localStorage.getItem('combo_challenge_last_kana')+"打鍵）</span>"
		}
	}if(document.getElementById("max_record_label") != null){
		document.getElementById("max_record_label").innerHTML = mode_record
	}
}

function details_generator(){
	/*
0[ID,
1Name,
2roma_combo,
3kana_combo,
4score,
5typing_speed,
6play_speed,
7typing_count_roma_mode,
8typing_count_kana_mode,
9typing_count_flick_mode])}
*/
	const max_details = this.data

	let details_html = "<h3 style='display:inline-block;margin-top:10px;margin-bottom:30px;text-indent: 0.4rem;'>"
	if(this.name == "now"){
		details_html += `只今のノーミス記録　詳細`
	}else if(this.name == "last"){
		details_html += `前回のノーミス記録　詳細`
	}else{
		details_html += `最大ノーミス記録　詳細`
	}
	details_html += "</h3>"
	details_html += max_details[max_details.length-1].length == 11 ? `　<span id=date style="font-size:90%;">(`+max_details[max_details.length-1][10]+`)</span>` : ""
	let transition_combo_kana = 0
	let transition_combo_roma = 0
	let roma_typing = 0
	let kana_typing = 0
	let flick_typing = 0
	let all_typing = 0
	let typing_speed_average = 0
	let level = 0
	let music_name
	for(let i=0;i<max_details.length;i++){
		transition_combo_roma += +max_details[i][2]
		transition_combo_kana += +max_details[i][3]
		roma_typing += +max_details[i][7]
		kana_typing += +max_details[i][8]
		flick_typing += +max_details[i][9]
		typing_speed_average += i+1<max_details.length ? +max_details[i][5] : 0
		level = max_details[i][1].match(/ \(難易度Lv.\)/)[0].match(/Lv./)[0]
		music_name = max_details[i][1].replace(/ \(難易度Lv.\)/,"")
		const score_board = `<div><div id=score_board>Score:`+max_details[i][4]+`,　打/秒:`+max_details[i][5]+`</div>`

		details_html +=
			`<div class="music_info"><div class="music_title"><a class="link" href="https://typing-tube.net/movie/show/`+max_details[i][0]+`">`+(i+1)+`曲目　`+music_name+`</a></div><div class="music_level">`+level+`, `+max_details[i][6]+`倍速</div></div>

<div class="score_board">
`+score_board+`
<div>コンボ： ローマ字単位「`+max_details[i][2]+`打鍵」　かな単位「`+max_details[i][3]+`打鍵」</div>
<div>　推移： ローマ字単位「`+transition_combo_roma+`打鍵」　かな単位「`+transition_combo_kana+`打鍵」</div>
</div></div></div>`
	}
	details_html +=
		`<div style="font-weight:600;margin-bottom:0;text-indent: 0.4rem;">--`+(this.name == "now"?"只今の結果":"最終結果")+`--</div>
<div id="last_result"><div style="background:rgba(0,0,0,0.5);padding: 19px;width:38rem;margin-bottom:25px;">
<h3><div>ノーミス持続平均速度「`+(max_details.length > 1 ? (typing_speed_average/(max_details.length-1)).toFixed(2) : max_details[0][5])+`打/秒」</div><br>
<div>最終コンボ： ローマ字単位「`+transition_combo_roma+`打鍵」　かな単位「`+transition_combo_kana+`打鍵」</div>
</h3></div></div>`
	all_typing = roma_typing+kana_typing+flick_typing
	details_html += `<div style="font-weight:600;margin-bottom:0;text-indent: 0.4rem;">各入力モード使用率</div><h3 style="margin-top:0;background:rgba(0,0,0,0.5);padding: 10px;display:inline-block;">ローマ字入力率「`+((roma_typing/all_typing)*100)+`%」　かな入力率「`+((kana_typing/all_typing)*100)+`%」　フリック入力率「`+((flick_typing/all_typing)*100)+`%」</h3></div>`
	if(this.name == "max"){
		details_html += `<span style="
    zoom: 150%;
"><input type="button" value="記録のインポート" style="
    float: right;
    margin-right: 10px;
" onclick="
alert('記録のインポートを行います。　現在の最大記録データは失われますのでご注意ください。')
document.getElementById('read_csv').click()">
<input id="read_csv" type="file" style="
    float: right;
    margin-right: 10px;
opacity:0;
position:absolute;
" onclick="
  document.getElementById('read_csv').addEventListener('change', function(event){
  var _file = event.target.files[0];
    if(_file != null){
        var fr = new FileReader();
        fr.onload = function(e) {
            var listOfRuby = fr.result.split('brtext');
if(listOfRuby[0] != 'combo_challenge_max_roma'){
alert('error')
return
}
            mapOfRuby = {};
for(let f=0;f<listOfRuby.length;f++){
if(f > 0){
if(listOfRuby[f-1] == 'combo_challenge_max_roma'){
localStorage.setItem('combo_challenge_max_roma',listOfRuby[f])
   }else if(listOfRuby[f-1] == 'combo_challenge_max_kana'){
localStorage.setItem('combo_challenge_max_kana',listOfRuby[f])
   }else if(listOfRuby[f-1] == 'combo_challenge_fullcombo_max'){
localStorage.setItem('combo_challenge_fullcombo_max',listOfRuby[f])
   }else if(listOfRuby[f-1] == 'combo_challenge_beatmap_data_max'){
localStorage.setItem('combo_challenge_beatmap_data_max',listOfRuby[f])
alert('記録の読み込みが完了しました。　再度、最大記録の詳細を開くと更新されます。')
   }
}
            }
        }
         fr.readAsText(_file);
	}
 })
document.getElementById('read_csv').removeAttribute('onclick')"
><label onclick="(function csv_export(){
    let res = confirm('現在の最高記録のバックアップをダウンロードします。別端末間での記録の共有が可能です。コンボ継続記録はご使用の端末内に保存されているので、この機能を使用して記録のバックアップをすることをお勧めします。');
    if( res == true ) {
let csvData= 'data:text/csv;charset=utf-8,';


csvData += 'combo_challenge_max_roma'+'brtext'
    csvData += localStorage.getItem('combo_challenge_max_roma');
csvData += 'brtext'
csvData += 'combo_challenge_max_kana'+'brtext'
    csvData += localStorage.getItem('combo_challenge_max_kana')+'brtext'
csvData += 'combo_challenge_fullcombo_max'+'brtext'
    csvData += localStorage.getItem('combo_challenge_fullcombo_max')+'brtext'
csvData += 'combo_challenge_beatmap_data_max'+'brtext'
    csvData += localStorage.getItem('combo_challenge_beatmap_data_max')
const encodedUri = encodeURI(csvData);
const link = document.getElementById('downloadCSV');
link.setAttribute('href', encodedUri);
link.setAttribute('download', '最大ノーミス記録.csv');
  }
})()"><a id="downloadCSV"><input type="button" value="記録のエクスポート" style="
    float: right;
    margin-right: 10px;
"
></a></label></span>`
	}
	let nwin = window.open("about:blank");
	nwin.document.open();
	nwin.document.write(`<HTML><head>
<style>
.score_board{
background:rgba(0,0,0,0.5);
padding: 19px;
width:38rem;
margin-bottom:25px;
}
.music_info {
    width: calc(38rem + 38px);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.music_title{
font-weight:600;
margin-bottom:0;
text-indent: 0.4rem;
width: 80%;
float: left;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.music_level{
font-weight:normal;
margin-bottom:0;
text-indent: 0.4rem;
float: right;
}
.link{
color:#fff;
text-decoration: none;
}
.link:hover{
 color: #58A8FF	;
}
</style>
</head>
<BODY style="overflow: scroll;color: #fff;background-color:`+getComputedStyle( document.querySelector("[data-sa-theme]"), null ).getPropertyValue("background-color")+`;">`+details_html+`
</BODY></HTML>`);
	nwin.document.close();

}


function time_conversion(){

	if(is_played&&!finished){
		setTimeout(function(){
			time_count = 0
			line_time_count = 0
			bar_base_update_count = 0
		}, 0);
		next_typing_kashi_check(count)
		time_calculation()
		total_time_calculation()
	}
	movieTotalTime = SELECTOR_ACCESS_OBJECT['bar_base'].getAttribute('max')/speed
	movie_mm =("00" + parseInt(parseInt(movieTotalTime) / 60)).slice(-2)
	movie_ss = ("00" +(parseInt(movieTotalTime) - movie_mm * 60)).slice(-2)
	map_info_generator()

}

play_speed_up = function () {
	if((count > 0 || title_speed) && play_mode == "normal") { return false; }
	let flag = true;
	player.getAvailablePlaybackRates().sort().forEach(function(sp) {
		if(sp > speed && flag) {
			speed = sp;
			flag = false;
		}
	});
	play_speed = speed;
	if(!PHONE_FLAG||player.getPlayerState() == 1){
		player.setPlaybackRate(speed);
	}

	document.getElementById("playspeed").textContent = speed.toFixed(2)+"倍速"
	document.getElementById("speed").textContent = play_speed.toFixed(2)+"倍速"
	if(play_mode == "normal"){

		if(play_speed == 2){
			speed_background = "#ed143d99"
			speed_color = "ghostwhite"
		}else if(play_speed == 1.75){
			speed_background = "#9370dba9"
			speed_color = "ghostwhite"
		}else if(play_speed == 1.5){
			speed_background = "#00ff7f7a"
			speed_color = "#FFF"
		}else if(play_speed == 1.25){
			speed_background = "#4ed6ff73"
		}else if(play_speed == 1){
			speed_background = "transparent"
		}
		document.getElementById("speed").setAttribute("style", `
    color:`+speed_color+`;
    background:`+speed_background+`;`);
	}
	time_conversion(speed)
}
play_speed_down = function () {
	if((count > 0 || title_speed) && play_mode == "normal") { return false; }
	let flag = true;
	player.getAvailablePlaybackRates().sort().reverse().forEach(function(sp) {
		if(sp < speed && flag) {
			speed = sp;
			flag = false;
		}
	});
	play_speed = speed;
	if(!PHONE_FLAG||player.getPlayerState() == 1){
		player.setPlaybackRate(speed);
	}
	document.getElementById("playspeed").textContent = speed.toFixed(2)+"倍速"
	document.getElementById("speed").textContent = play_speed.toFixed(2)+"倍速"

	if(play_mode == "normal"){
		if(play_speed == 2){
			speed_background = "#ed143d99"
			speed_color = "ghostwhite"
		}else if(play_speed == 1.75){
			speed_background = "#9370dba9"
			speed_color = "ghostwhite"
		}else if(play_speed == 1.5){
			speed_background = "#00ff7f7a"
			speed_color = "#FFF"
		}else if(play_speed == 1.25){
			speed_background = "#4ed6ff73"
		}else if(play_speed == 1){
			speed_background = "transparent"
		}
		document.getElementById("speed").setAttribute("style", `
    color:`+speed_color+`;
    background:`+speed_background+`;`);
	}
	time_conversion(speed)
}
speedup = function () {
	if(!is_played || play_speed == 2){return}
	speed = player.getPlaybackRate();
	flag = true;
	player.getAvailablePlaybackRates().sort().forEach(function(sp) {
		if(sp > play_speed && sp > speed && flag) {
			speed = sp;
			flag = false;
		}
	});
	if(flag) {
		speed = play_speed;
	}
	practice_time = line_playing_time-(headtime - lyrics_array[count - 1][0])/speed
	player.setPlaybackRate(speed);
	document.getElementById("speed").textContent = speed.toFixed(2)+"倍速"
	time_conversion(speed)
	replace_complete_area("x"+speed.toFixed(2))
}









/////////////////////////////////////////////////////////////////////////////////////////////////
/**1FPS毎(ブラウザにより異なる)の処理
*@playheadUpdate ここから---
*/
playheadUpdate = function () {
	headtime = player.getCurrentTime() + player.difftime;
	now_time = headtime/speed
	if(seeked_count != count && !next_char[0] && lyrics_array[count][0] - headtime > skip || reset_flag){
		skipguide()
		if(skip) {
			press_skip()
		}
	}


	if(lyrics_array[count][0] <= headtime){
		if(lyrics_array[count][1] == "end") {
			gameover()
			return;
		}
		if(next_char[0]){line_result_check()}

		if(SELECTOR_ACCESS_OBJECT['flick-input'] && PHONE_FLAG && typing_array_kana[count][0] && typing_array_kana[count][0].match(/[ぁ-ゞ]/)){
			if(document.activeElement.id == "flick-input"){
				document.activeElement.blur()
				SELECTOR_ACCESS_OBJECT['flick-input-second'].focus()
				setTimeout(function(){
					SELECTOR_ACCESS_OBJECT['flick-input'].focus()
				},0)
			}
		}
		if(play_mode == "practice" && count>=logcount-1){practice_mode_line_update()}
		add_line_typingword(count)
		if(line_input.length > 0){ add_next_char(false) }
		updateLineView()
		updateLineView_typing(true) //canvas_lyric_update()
		SELECTOR_ACCESS_OBJECT['skip-guide'].textContent = ""
		count ++;
		time_update()
		next_typing_kashi_check(count)
		completed=false;
		tsu_flag = false
		Continuous_xtu_flag = false
		n_flag = false
		time_calculation(true)
		scroll_support()
		if(count >= logcount){
			if(!next_char){//空白ライン
				typing_speed_calculation()
				nothing_line_log.push([headtime,"", Math.round(score), count, 3, 2]);
				line_typing_count_miss_count_log.splice(count-1, 1, [0,0,combo]);
			}
		}
		if(OPTION_ACCESS_OBJECT['replay-mode'] && last_seek_line_count <= count && line_typinglog_log[count-1][push_counter] != undefined){
			if(kana_mode && line_typinglog_log[count-1][push_counter][3] == "false\r" || !kana_mode && line_typinglog_log[count-1][push_counter][3] == "true\r"){
				input_mode_change()
			}
		}
		if(line_length-(failer_count+complete_count) == 0 && play_mode != "practice"){window.setTimeout(typing_result_generator, 150);}
		if(perfect_mode_judge(false)){return;}
	}

	if(play_mode == 'practice'){
		//リプレイ再生
		if(OPTION_ACCESS_OBJECT['replay-mode'] && last_seek_line_count < count && !seek_line_flag && line_typinglog_log[count-1][push_counter] != undefined && headtime >= line_typinglog_log[count-1][push_counter][2]){ practice_replay_mode() }
		//0.5秒前に止めるモード
		if( !OPTION_ACCESS_OBJECT['replay-mode'] && OPTION_ACCESS_OBJECT['practice-stop'] && last_seek_line_count < count && !seek_line_flag && next_char[0] && lyrics_array[count][0] - 0.5 <= headtime) {
			if(player.getPlayerState() == 1) {
				if(!stop_time_flag){
					stop_time=(new Date).getTime()
					stop_time_flag=true
				}
				createjs.Ticker.addEventListener("tick", time_calculation);
				player.pauseVideo();
			}
			return;
		}
	}

	time_update()
}



///////////////////
/**playheadUpdate()
*@FPS単位で呼ぶ処理 ここから---
*/



let skip_code = ""
function skipguide(){
	//スキップ案内を表示
	if(OPTION_ACCESS_OBJECT['skip-guide-key'] === 'skip-guide-enter-key'){skip_code = "Enter";}else{skip_code = "Space";}
	if(reset_flag&&lyrics_array[logcount-1][0]-1<=headtime){reset_flag=false;}

	if(!skip && OPTION_ACCESS_OBJECT['skip-guide-effect'] && !SELECTOR_ACCESS_OBJECT['skip-guide'].textContent.includes("skip")){
		if(completed && line_remaining_time >= 3.0 || !completed && line_remaining_time >= 3.0 && line_playing_time >= 0.4 && (SELECTOR_ACCESS_OBJECT['count-anime'].textContent == "") || reset_flag){
			if(keyboard == "mac"){
				if(document.activeElement.id == "flick-input"){
					SELECTOR_ACCESS_OBJECT['skip-guide'].innerHTML = "<span style='color:"+OPTION_ACCESS_OBJECT['skip-guide-effect-color']+";'><i>Tap to skip. ⏩</i></span>";
					document.getElementById("tap_here").style.display = "block"
					document.getElementById("tap_here").style.opacity = "0.5"
				}
			}else{
				SELECTOR_ACCESS_OBJECT['skip-guide'].innerHTML = "<span style='color:"+OPTION_ACCESS_OBJECT['skip-guide-effect-color']+";'><i>Type "+ skip_code +" key to skip. ⏩</i></span>";
			}
		}
	}else if(!reset_flag&&( (line_remaining_time <= 3.0 && completed || line_remaining_time <= 1.2 && !completed || SELECTOR_ACCESS_OBJECT['count-anime'].textContent != "") && SELECTOR_ACCESS_OBJECT['skip-guide'].textContent != "") ){
		SELECTOR_ACCESS_OBJECT['skip-guide'].textContent = "";//(ラインクリア時は3秒)
		if(keyboard == "mac" && document.activeElement.id == "flick-input" && !SELECTOR_ACCESS_OBJECT['skip-guide'].textContent.includes("Tap")){
			document.getElementById("tap_here").style.display = "none"
			document.getElementById("tap_here").style.opacity = "1"
		}
	}


}


let countdown_anime = false//カウントダウンアニメのフラグ
function sec_countdownanime(){

	if(4.0 >= line_remaining_time && line_remaining_time > 3.0 && SELECTOR_ACCESS_OBJECT['count-anime'].textContent != "3"){//間奏ラインの残り時間大体3秒ぐらいのとき
		SELECTOR_ACCESS_OBJECT['count-anime'].innerHTML = "<span style='color:"+OPTION_ACCESS_OBJECT['countdown-effect-color']+";' class='countdown_animation count_animated'><i>3</i></span>";//残り時間を整数で歌詞エリアに表示
	}else if(3.0 >= line_remaining_time && line_remaining_time > 2.0 && SELECTOR_ACCESS_OBJECT['count-anime'].textContent != "2"){//間奏ラインの残り時間大体3秒ぐらいのとき
		SELECTOR_ACCESS_OBJECT['count-anime'].innerHTML = "<span style='color:"+OPTION_ACCESS_OBJECT['countdown-effect-color']+";'class='countdown_animation count_animated'><i>2</i></span>";//残り時間を整数で歌詞エリアに表示
	}else if(2.0 >= line_remaining_time && line_remaining_time > 1.0 && SELECTOR_ACCESS_OBJECT['count-anime'].textContent != "1" && SELECTOR_ACCESS_OBJECT['count-anime'].textContent != ""){//間奏ラインの残り時間大体3秒ぐらいのとき
		SELECTOR_ACCESS_OBJECT['count-anime'].innerHTML = "<span style='color:"+OPTION_ACCESS_OBJECT['countdown-effect-color']+";'class='countdown_animation count_animated'><i>1</i></span>";//残り時間を整数で歌詞エリアに表示
	}else if(line_remaining_time <= 1 && SELECTOR_ACCESS_OBJECT['count-anime'].textContent != "GO!" && SELECTOR_ACCESS_OBJECT['count-anime'].textContent != ""){////間奏ラインの残り時間大体1秒ぐらいのとき
		SELECTOR_ACCESS_OBJECT['count-anime'].innerHTML = "<span style='color:"+OPTION_ACCESS_OBJECT['countdown-effect-color']+";'class='countdown_animation count_animated'><i>GO!</i></span>";//歌詞エリアにGO!と表示する
	}


}



//練習モード
let stop_time=0 //止まった時間
let stop_time_flag=false //止まったフラグ
let practice_time = 0 //ライン練習タイム
let practice_time_current = 0 //蓄積ラインタイム
let practice_speed_time = 0 //打鍵速度更新頻度フラグ



let latency = 0; //反応するまでにかかった時間
let line_playing_time = 0;//ライン経過時間
let past_playing_time = 0;//(過去の入力時間合計)
let line_remaining_time = 0;//ライン残り時間
let playing_time_current = 0;//入力時間(ライン経過時間 + 過去の入力時間合計)


function time_calculation(interval_update){
	line_remaining_time = (lyrics_array[count][0] - headtime)/speed; //ライン残り時間


	if(!completed){
		if(stop_time_flag){practice_time=(((new Date).getTime()-stop_time)/1000)+practice_time_current}
		line_playing_time = (count - 1) > -1 ? (headtime - lyrics_array[count - 1][0])/speed+practice_time:headtime/speed+practice_time //経過ライン時間(裏ステータス)
		if(next_char[0]){
			if(typing_count-typing_count_save == 0){
				latency = line_playing_time
			}
			playing_time_current = line_playing_time + past_playing_time //タイピングワードが存在していた累計時間(裏ステータス)
			if(interval_update && !seek_line_flag && (!stop_time_flag || stop_time_flag && practice_time - practice_speed_time >= 0.1)){
				typing_speed_calculation()
			}
		}else if(!next_char){
			latency = 0
		}

	}

	if(!stop_time_flag || stop_time_flag && practice_time - practice_speed_time >= 0.1){
		SELECTOR_ACCESS_OBJECT['remaining-time'].textContent = "残り" + line_remaining_time.toFixed(1) + "秒"
		practice_speed_time = practice_time
		line_time_count = now_time
	}

}


function total_time_calculation(){
	SELECTOR_ACCESS_OBJECT['total-time'].textContent = ("00" + parseInt(parseInt(now_time) / 60)).slice(-2) + ':' + ("00" +(parseInt(now_time) - ("00" + parseInt(parseInt(now_time) / 60)).slice(-2) * 60)).slice(-2) + " / " + movie_mm+':'+movie_ss;
	time_count = now_time
}




let speed_marker= "" //平均より、速ければ▲。遅ければ▼。


let typing_speed = 0; //累計打鍵速度
let line_typingspeed = 0; //ラインの打鍵速度
let line_typingspeed_rkpm = 0; //初速を無視したライン打鍵速度

let falilue_line_set_count = -1

function typing_speed_calculation(){
	line_typingspeed = Math.round( ((typing_count-typing_count_save) / line_playing_time) * 100) / 100
	line_typingspeed_rkpm = typing_count-typing_count_save == 0 ? line_typingspeed : Math.round( ((typing_count-typing_count_save) / (line_playing_time-latency)) * 100) / 100
	typing_speed = Math.round( (typing_count/playing_time_current) * 100) / 100

	if(line_playing_time <=1 && !completed || line_typingspeed == typing_speed || !next_char){
		speed_marker=""
	}else if(typing_speed>line_typingspeed || (typing_speed>line_typingspeed&&completed)){
		speed_marker="▼"
	}else if(typing_speed<line_typingspeed || (typing_speed<line_typingspeed&&completed)){
		speed_marker="▲"
	}
	//DOMに打鍵時間を表示
	SELECTOR_ACCESS_OBJECT['type-speed'].textContent = typing_speed.toFixed(2);
	SELECTOR_ACCESS_OBJECT['line-speed'].textContent = line_typingspeed.toFixed(2) + "打/秒" + speed_marker;
}


let time_count = 0
let line_time_count = 0



var headtime = 0;
var now_time = 0;
let bar_base_update_count = 0

//playheadUpdateの時間処理
function time_update(){

	if(countdown_anime){sec_countdownanime()}



	const line_meter = (count > 0 ? headtime - lyrics_array[count-1][0] : 0)
	SELECTOR_ACCESS_OBJECT['bar_input_base'].setAttribute('value',line_meter); //ラインバー蓄積



	if(now_time - bar_base_update_count >= bar_base_update_fps){//ライン経過時間 ＆ 打鍵速度計算
		SELECTOR_ACCESS_OBJECT['bar_base'].setAttribute('value', headtime); //累計時間バー蓄積
		bar_base_update_count = now_time
	}

	if(now_time - line_time_count >= 0.1){//ライン経過時間 ＆ 打鍵速度計算
		time_calculation(true)
		if(now_time - time_count >= 1){//曲の経過時間を[分:秒]で表示}
			total_time_calculation()
		}
	}


}



///////////////////////////////////////
/**lyrics_array[count][0] <= headtime時
*@ライン更新
*/


function canvas_lyric_update(){
	lyric_canvas.text = " "+lyrics_array[count][1];
	lyric_canvas.y = clear.y+clear.getBounds().height +40
	stage.addChild(lyric_canvas);
	stage.update();

	next_lyric_canvas.text = " "+lyrics_array[count+1][1];
	next_lyric_canvas.y = (lyric_canvas.y+lyric_canvas.getBounds().height)+30
	stage.addChild(next_lyric_canvas);
	stage.update();
}





var latency_kpm_rkpm_log = []
var escape_word_length_log = [] //逃した文字
var nothing_line_log = [] //タイピングしていないライン情報を保存(typinglogに保存されない為)
var line_score_log = [] //そのラインで失ったスコア
var clear_time_log = [] //入力時間のログ
var line_typing_count_miss_count_log = [] //打鍵数
var line_typinglog_log = []
///////////////////////////////////


let total_latency = 0 //latencyの合計値
let typing_count_save = 0; //ライン切替時、現在の打鍵数を取得する
let escape_word_length = 0; //逃した打鍵数
let escape_score = 0; // 失点数
let miss_typing_count_save = 0 //ライン切替時、現在のミス打鍵数を取得する
let next_kpm_play_speed = 0//通常速度で求められるkpm(低速プレイ時のスコア調整で使用)

//現在ラインのタイピングワード情報が捨てられる直前の処理
let kana_combo = 0
let roma_combo = 0
let miss_diff_kana = 0
let miss_diff_roma = 0

function combo_challenge_combo_Calc(){
	if(combo){
		kana_combo += daku_handaku_join(false,true,already_input.replace(/ /g,"").split("")).join("").length-miss_diff_kana
		roma_combo += already_input_roma.replace(/ /g,"").length-miss_diff_roma
	}
	miss_diff_kana = 0
	miss_diff_roma = 0
}

function line_result_check(){
	total_latency += latency
	typing_speed_calculation()
	let slow_speed_adjust_key_count = 0
	if(play_speed<DefaultPlaySpeed || stop_time_flag){
		next_kpm_play_speed = (line_difficulty_data[count-1]*DefaultPlaySpeed)
		let slow_speed_adjust_key_score = 0
		let slow_speed_adjust_key_score_point = 0
		slow_speed_adjust_key_count = Math.floor((line_typingspeed/(play_mode=="normal" ? 1.32:1))*((lyrics_array[count][0]-(count>0 ? lyrics_array[count-1][0]:0))/DefaultPlaySpeed))
		const word = !kana_mode ? typing_array_roma[count-1] : typing_array_kana[count-1]

		word.forEach((typing,index) => {
			if(slow_speed_adjust_key_count >= typing.length + slow_speed_adjust_key_score){
				slow_speed_adjust_key_score += typing.length
				slow_speed_adjust_key_score_point += typing_array_roma[count-1][index].length
			}
		})
		let min_line_score = 0
		min_line_score += line_score
		line_score = line_typingspeed < next_kpm_play_speed ? (slow_speed_adjust_key_score_point*score_per_char) : (roma_notes_list[count-1] * score_per_char)
		line_score -= (typing_miss_count-miss_count_save)*(score_per_char/4)
		if(min_line_score > line_score){
			line_score = min_line_score
		}
		if(play_mode == "normal"){
			score += line_score
			SELECTOR_ACCESS_OBJECT['score-value'].textContent = (score/2000).toFixed(2)
		}

	}

	if(next_char && !push_counter && (line_score_log[count-1][0] <= line_score || line_score_log[count-1][0] == line_score && latency_kpm_rkpm_log[count-1][1] < line_typingspeed)){



		const roma_word = line_input_roma.join('').replace(/ /g,"")
		const escape_word = !kana_mode ? next_char[1]+roma_word : next_char[0]+line_input_kana.join('').replace(/ /g,"")
		const escape_notes = !kana_mode ? Math.round(next_point/score_per_char)+roma_word.length : escape_word.length
		const lost_score = (roma_notes_list[count-1]*score_per_char) - line_score
		line_score_log.splice(count-1, 1, [line_score,lost_score]);
		line_typinglog_log.splice(count-1, 1, line_typinglog);
		escape_word_length_log.splice(count-1, 1, [escape_word , escape_notes , completed ? 1 : 2]);
		latency_kpm_rkpm_log.splice(count-1, 1,[latency,line_typingspeed,line_typingspeed_rkpm]);
		line_typing_count_miss_count_log.splice(count-1, 1, [typing_count-typing_count_save,typing_miss_count-miss_count_save,combo]);
		if(!completed){ clear_time_log.splice(count-1, 1, (lyrics_array[count - 0][0]-lyrics_array[count - 1][0])/speed+practice_time); }
		if(completed && (play_speed<DefaultPlaySpeed || stop_time_flag)){
			escape_score = line_score_log.reduce((a,x) => a+=x[1],0);
			StatusCountsUpdate(["Rank"])
		}

		if(play_mode == "practice"){
			if(completed){
				score = line_score_log.reduce((a,x) => a+=x[0],0);
				StatusCountsUpdate(["Score"])
			}
			practice_line_status_display(slow_speed_adjust_key_count)
		}

		//継続コンボ計測
		if(combo_challenge){
			combo_challenge_combo_Calc()
		}
		if(!completed){
			if(typing_count_save-typing_count == 0 && typing_miss_count-miss_count_save == 0){ //放置ライン蓄積
				nothing_line_log.push([headtime,"", Math.round(score), count, 2, 2]);
			}
			if(play_mode == "normal"){
				escape_word_length += escape_notes
				escape_score += lost_score-((score_per_char/4)*(typing_miss_count-miss_count_save))
				failer_count ++
				StatusCountsUpdate(["Rank"])
			}
			StatusCountsUpdate(["Correct","Line","Escape"])

			past_playing_time += clear_time_log[count-1]//ライン時間を加算
		}if(!next_char && count >= logcount){//空白ライン
			nothing_line_log.push([headtime,"", Math.round(score), count-1, 3, 2]);
			line_typing_count_miss_count_log.splice(count-2, 1, [0,0,combo]);
		}
	}

}

function practice_line_status_display(slow_speed_adjust_key_count){
	clear_word = ""
	let adjust_key_count = 0
	let adjusted_word = ""
	for(let i = 0; i < line_typinglog.length; i++){//入力した文字の数繰り返す

		if(line_typinglog[i][1] == 1){//正当
			if(slow_speed_adjust_key_count == adjust_key_count && (play_speed<DefaultPlaySpeed || stop_time_flag && line_typingspeed < next_kpm_play_speed)){
				adjusted_word += line_typinglog[i][0]
				continue
			}
			clear_word += i > 0 && line_typinglog[i-1][1] == 0 ? '<span style="color:#FF3554;">'+line_typinglog[i][0].replace(' ', '⎽')+'</span>' : '<span style="color:#60d7ff;">'+line_typinglog[i][0].replace(' ', '⎽')+'</span>'
			adjust_key_count++
		}
	}
	if(adjusted_word != ""){
		clear_time_log.splice(count-1, 1, line_playing_time)
		escape_word_length_log[count-1].splice(0, 1, adjusted_word+escape_word_length_log[count-1][0])
	}

	clear_word += line_typinglog.length && line_typinglog[line_typinglog.length-1][1] == 0 ? '<span style="color:#ae81ff;">'+escape_word_length_log[count-1][0][0].replace(' ', '⎽')+'</span>'+escape_word_length_log[count-1][0].slice(1) : escape_word_length_log[count-1][0]

	const statu_speed_query = document.querySelectorAll('[number="'+(count-1)+'"] .statu_speed')
	const statu_miss_query = document.querySelectorAll('[number="'+(count-1)+'"] .statu_miss')
	const statu_score_query = document.querySelectorAll('[number="'+(count-1)+'"] .statu_score')
	const daken_moji_query = document.querySelectorAll('[number="'+(count-1)+'"] .daken_moji')
	const pass_query = document.querySelectorAll('[number="'+(count-1)+'"] .pass')
	for(let i = 0; i < statu_speed_query.length; i++){//入力した文字の数繰り返す
		statu_speed_query[i].classList.add('passed');
		statu_speed_query[i].textContent = '打/秒: '+latency_kpm_rkpm_log[count-1][1].toFixed(2)+',　初速抜き: '+latency_kpm_rkpm_log[count-1][2].toFixed(2)
		statu_miss_query[i].textContent = typing_miss_count-miss_count_save
		statu_score_query[i].textContent = (line_score_log[count-1][0]/2000).toFixed(2)
		if(!escape_word_length_log[count-1][0]){
			clear_word = clear_word.replace(/<span style="color:#60d7ff;">/g,'<span style="color:rgb(30, 255, 82);">')
		}
		daken_moji_query[i].innerHTML = clear_word
		pass_query[i].innerHTML = !escape_word_length_log[count-1][0] ? '<span class="seikou" style="color:#FFFF00;">clear</span>' : '<span class="sippai" style="color:#F12FFF;">failed'+(play_speed < DefaultPlaySpeed ? "<span style='font-size: 90%; margin-left:7px;'>(速度:"+play_speed.toFixed(2)+")</span>":"")+'</span>'
	}

}
let kana_mode_convert_rule_before = ["←", "↓", "↑", "→", "『", "』"]
let kana_mode_convert_rule_after = ["ひだり", "した", "うえ", "みぎ", "「", "」"]
function add_line_typingword(line_number){

	line_score = 0
	practice_time = 0
	line_typinglog = []
	miss_count_save = typing_miss_count
	typing_count_save = typing_count
	countdown_anime = false //カウントダウンフラグOFF
	already_input = "";
	already_input_roma = "";
	next_char = ""

	line_input = typing_array[line_number].slice();
	line_input_roma = typing_array_roma[line_number].slice();
	line_input_kana = typing_array_kana[line_number].slice();
	if(kana_mode){
		if(/←|↓|↑|→|『|』/.test(line_input_kana.join(""))){
			for(h=0;h<line_input_kana.length;h++){
				const convert_target = kana_mode_convert_rule_before.indexOf(line_input_kana[h])
				if(convert_target >= 0){
					line_input_kana[h] = kana_mode_convert_rule_after[convert_target]
				}
			}
		}

		if(OPTION_ACCESS_OBJECT['dakuten-handakuten-split-mode']){
			line_input_kana = daku_handaku_join(false,false,line_input_kana)
		}
	}

}


//タイピングワードフィールド全体更新
//ラインアップデート時更新


function updateLineView() {
	let kashi_kana_html
	let kashi_roma_html
	const SCROLL_MODE_STYLE = OPTION_ACCESS_OBJECT['character-scroll'] ? 'style="position: absolute;bottom: 3px;"' : ""
	const first_color_text_shadow = OPTION_ACCESS_OBJECT['next-character-color'] != "transparent" ? `text_shadow` : ``
	const word_text_shadow = OPTION_ACCESS_OBJECT['word-color'] != "transparent" ? `text_shadow` : ``
	kashi_kana_html = `<span ${SCROLL_MODE_STYLE}><span id='correct-input-kana' class='correct-input ${OPTION_ACCESS_OBJECT['bordering-word']?"" : "text_shadow"}' style='color:${OPTION_ACCESS_OBJECT['correct-word-color']};'></span><span id='kana-first-word' class='next-character-color ${first_color_text_shadow}' style='color: ${OPTION_ACCESS_OBJECT['next-character-color']} ;position: relative;'></span><span id='kana-second-word' class='next-character-color ${first_color_text_shadow}' style='color:${!kana_mode ? OPTION_ACCESS_OBJECT['next-character-color'] : OPTION_ACCESS_OBJECT['word-color']};'></span><span id='typing-word-kana' class='typing_word ${word_text_shadow}' style='color:${OPTION_ACCESS_OBJECT['word-color']};'></span></span>`;
	kashi_roma_html = `<span ${SCROLL_MODE_STYLE}><span id='correct-input-roma' class='correct-input ${OPTION_ACCESS_OBJECT['bordering-word']?"" : "text_shadow"}' style='color:${OPTION_ACCESS_OBJECT['correct-word-color']};'></span><span id='first-color-roma' class='next-character-color ${first_color_text_shadow}' style='color:${OPTION_ACCESS_OBJECT['next-character-color']};position: relative;'></span><span id='typing-word-roma' class='typing_word ${word_text_shadow}' style='color:${OPTION_ACCESS_OBJECT['word-color']};'></span></span>`;
	SELECTOR_ACCESS_OBJECT['roma-input-dom'].innerHTML = kashi_roma_html;
	SELECTOR_ACCESS_OBJECT['kana-input-dom'].innerHTML = kashi_kana_html;

	SELECTOR_ACCESS_OBJECT['correct-input-roma'] = document.getElementById("correct-input-roma")
	SELECTOR_ACCESS_OBJECT['first-color-roma'] = document.getElementById("first-color-roma")
	SELECTOR_ACCESS_OBJECT['typing-word-roma'] = document.getElementById("typing-word-roma")
	SELECTOR_ACCESS_OBJECT['correct-input'] = document.getElementsByClassName("correct-input")
	SELECTOR_ACCESS_OBJECT['correct-input-kana'] = document.getElementById("correct-input-kana")
	SELECTOR_ACCESS_OBJECT['kana-first-word'] = document.getElementById("kana-first-word")
	SELECTOR_ACCESS_OBJECT['kana-second-word'] = document.getElementById("kana-second-word")
	SELECTOR_ACCESS_OBJECT['typing-word-kana'] = document.getElementById("typing-word-kana")
	SELECTOR_ACCESS_OBJECT['next-character-color'] = document.getElementsByClassName("next-character-color")[0]
	SELECTOR_ACCESS_OBJECT['kashi_sub'].children[0].style.display = OPTION_ACCESS_OBJECT['sub'] ? "inline" : "none"

}


let next_kpm = 0;//次のラインの必要kpm
//カウントダウンして良いラインならcountdownフラグON
//次のタイピングワードの必要打鍵速度計算
function next_typing_kashi_check(line_number){

	if(typing_array_kana[line_number-1].join("").indexOf(" ") < 0){
		SELECTOR_ACCESS_OBJECT['kashi_sub'].classList.remove('eng_word')
		SELECTOR_ACCESS_OBJECT['kashi_roma'].classList.remove('eng_word')
		SELECTOR_ACCESS_OBJECT['kashi_sub'].classList.add('jp_word')
		SELECTOR_ACCESS_OBJECT['kashi_roma'].classList.add('jp_word')
	}else{
		SELECTOR_ACCESS_OBJECT['kashi_sub'].classList.remove('jp_word')
		SELECTOR_ACCESS_OBJECT['kashi_roma'].classList.remove('jp_word')
		SELECTOR_ACCESS_OBJECT['kashi_sub'].classList.add('eng_word')
		SELECTOR_ACCESS_OBJECT['kashi_roma'].classList.add('eng_word')
	}


	SELECTOR_ACCESS_OBJECT['bar_input_base'].setAttribute('max', lyrics_array[line_number][0] - lyrics_array[line_number-1][0]);
	SELECTOR_ACCESS_OBJECT['count-anime'].textContent = ""
	SELECTOR_ACCESS_OBJECT['kashi'].innerHTML = '<ruby>　<rt>　</rt></ruby>'+lyrics_array[line_number-1][1];

	displayNextLyric(line_number)

	if(OPTION_ACCESS_OBJECT['replay-mode'] || last_seek_line_count > line_number && play_mode == "practice" || play_mode == "normal" && next_char[0]){
		document.getElementById("complete_effect").classList.remove('countdown_animation','count_animated')
		document.getElementById("complete_effect").textContent = OPTION_ACCESS_OBJECT['replay-mode'] && !seek_line_flag && line_typinglog_log[line_number-1].length > 1 ? "Replay" : ""
	}


	if(typing_array_kana[line_number][0]){
		if(!next_char && OPTION_ACCESS_OBJECT['countdown-effect'] && !lyrics_array[line_number-1][1]){countdown_anime = true}
		//次ラインの打鍵速度を計算して表示
		next_kpm = (line_difficulty_data[line_number]*speed)
		SELECTOR_ACCESS_OBJECT['next-kpm'].innerHTML = "<span id='kpm_color' style='color:"+OPTION_ACCESS_OBJECT['next-lyric-color']+";'>&nbsp;NEXT:<span class='next_kpm_value'>"+next_kpm.toFixed(2)+"</span>打/秒</span>";
	}else{
		SELECTOR_ACCESS_OBJECT['next-kpm'].innerHTML = "&nbsp;";
	}

}

function displayNextLyric(lineCount){
	if(OPTION_ACCESS_OBJECT['next-lyric-display-option'] === 'next-text-kana'){
		SELECTOR_ACCESS_OBJECT['kashi_next'].innerHTML = lyrics_array[lineCount][1] != 'end' && !typing_array_kana[lineCount][0] && lyrics_array[lineCount][0].substr( -6, 1 ) != "." ? '<ruby>　<rt>　</rt></ruby>' : '<ruby>　<rt>　</rt></ruby>'+typing_array_kana[lineCount].join('');
	}else{
		SELECTOR_ACCESS_OBJECT['kashi_next'].innerHTML = lyrics_array[lineCount][1] != 'end' && !typing_array_kana[lineCount][0] && lyrics_array[lineCount][0].substr( -6, 1 ) != "." ? '<ruby>　<rt>　</rt></ruby>' : '<ruby>　<rt>　</rt></ruby>'+lyrics_array[lineCount][1];
	}
}

//スクロール調整設定ON時
//歌詞が長すぎてプレイエリアが画面外に出てしまう場合はスクロール調整
function scroll_support(){

	if(OPTION_ACCESS_OBJECT['play-scroll'] && auto_scroll_flag && count &&document.documentElement.scrollTop+SELECTOR_ACCESS_OBJECT['kashi_roma'].getBoundingClientRect().top<Number((window.scrollY+document.documentElement.clientHeight).toFixed())){


		if( window.scrollY+document.documentElement.clientHeight < document.documentElement.scrollTop+CONTROLBOX_SELECTOR.getBoundingClientRect().top+CONTROLBOX_SELECTOR.clientHeight-20 && document.documentElement.clientHeight-SELECTOR_ACCESS_OBJECT['header'].clientHeight > parseInt(window.getComputedStyle(CONTROLBOX_SELECTOR).height)-20){

			if(+OPTION_ACCESS_OBJECT['scroll-adjustment']>=0){
				window.scrollTo({
					top: (document.documentElement.scrollTop+CONTROLBOX_SELECTOR.getBoundingClientRect().top+CONTROLBOX_SELECTOR.clientHeight-document.documentElement.clientHeight-10),
					behavior: "smooth",
				});
			}else{
				window.scrollTo({
					top: (document.documentElement.scrollTop+CONTROLBOX_SELECTOR.getBoundingClientRect().top+CONTROLBOX_SELECTOR.clientHeight+(+OPTION_ACCESS_OBJECT['scroll-adjustment'])-document.documentElement.clientHeight),
					behavior: "smooth",
				});
			}

		}else if((document.documentElement.clientHeight-SELECTOR_ACCESS_OBJECT['header'].clientHeight)<parseInt(window.getComputedStyle(CONTROLBOX_SELECTOR).height)){
			if(document.getElementById("gauge").style.display == "none"){
				window.scrollTo({
					top: document.documentElement.scrollTop+CONTROLBOX_SELECTOR.getBoundingClientRect().top-SELECTOR_ACCESS_OBJECT['header'].clientHeight,
					behavior: "smooth",
				});
			}else{
				window.scrollTo({
					top: document.documentElement.scrollTop+document.getElementById("player").getBoundingClientRect().top+ document.getElementById("player").clientHeight-SELECTOR_ACCESS_OBJECT['header'].clientHeight,
					behavior: "smooth"
				});
			}

		}else if(play_mode == "normal" && (!lyrics_array[count-1][2]&&!lyrics_array[count-1][1] ||!lyrics_array[count-2]&&lyrics_array[count-1][2])){
			if(document.documentElement.scrollTop+SELECTOR_ACCESS_OBJECT['kashi_roma'].getBoundingClientRect().top+SELECTOR_ACCESS_OBJECT['kashi_roma'].clientHeight>window.scrollY && control_default_size < document.documentElement.scrollTop+CONTROLBOX_SELECTOR.getBoundingClientRect().top+CONTROLBOX_SELECTOR.clientHeight-10){
				window.scrollTo({
					top:document.documentElement.scrollTop+CONTROLBOX_SELECTOR.getBoundingClientRect().top+CONTROLBOX_SELECTOR.clientHeight+(+OPTION_ACCESS_OBJECT['scroll-adjustment'])-document.documentElement.clientHeight,
					behavior: "smooth",
				})
			}
		}


	}

}








/////////////////////////////////////////////////////////////////////////////////////////////////
/**
*@練習モード ここから---
*/



function practice_mode_line_update(){

	if(!seek_line_flag && !push_counter){
		if((next_char[0] || line_typingspeed < next_kpm_play_speed && already_input_roma) && count && OPTION_ACCESS_OBJECT['seek-line-failed'] && document.querySelector('[number="'+(count-1)+'"] .seikou') == null){
			practice_failed_auto_set()
			falilue_line_set_count = count
		}
		if(falilue_line_set_count == count && play_speed >= DefaultPlaySpeed && completed &&(line_typing_count_miss_count_log[count-1][1] == 0 && OPTION_ACCESS_OBJECT['seek-line-miss'] || OPTION_ACCESS_OBJECT['seek-line-failed'] && !OPTION_ACCESS_OBJECT['seek-line-miss'])){
			seek_line_delete()
			falilue_line_set_count = -1
		}
	}
	if(last_seek_line_count != count){
		seek_line_flag = false
		line_move_flag = false
	}
	practice_mode_status_update()
	push_counter = 0
	practice_time_current=0

}


function practice_mode_status_update(){
	now_rank = 0
	if(!OPTION_ACCESS_OBJECT['replay-mode']){
		score = line_score_log.reduce((a,x) => a+=x[0],0);
		escape_score = line_score_log.reduce((a,x) => a+=x[1],0);
		past_playing_time = clear_time_log.reduce((a,x) => a+=x,0);
		escape_word_length = escape_word_length_log.reduce((a,x) => a+=x[1],0);
		typing_count = line_typing_count_miss_count_log.reduce((a,x) => a+=x[0],0);
		typing_miss_count = line_typing_count_miss_count_log.reduce((a,x) => a+=x[1],0);
		complete_count = document.querySelectorAll("#typing-line-result .seikou").length
	}else{
		score = 0
		typing_speed = 0
		typing_count = 0
		escape_score = 0
		typing_miss_count = 0
		past_playing_time = 0
		escape_word_length = 0
		for(let t = 0; t <= count-1; t++){
			score += line_score_log[t][0]
			escape_score +=  line_score_log[t][1]
			past_playing_time += clear_time_log[t]
			escape_word_length += escape_word_length_log[t][1]
			typing_count += line_typing_count_miss_count_log[t][0]
			typing_miss_count += line_typing_count_miss_count_log[t][1]
			if(t == count-1){
				combo = line_typing_count_miss_count_log[t][2]
			}
		}
		if(seek_line_flag){
			score += line_score_log[count][0]
			escape_score +=  line_score_log[count][1]
			past_playing_time += clear_time_log[count]
			escape_word_length += escape_word_length_log[count][1]
			typing_count += line_typing_count_miss_count_log[count][0]
			typing_miss_count += line_typing_count_miss_count_log[count][1]
			combo = line_typing_count_miss_count_log[count][2]
		}
		if(isNaN(score)) {
			score = 0;
			typing_count = 0
			escape_score = 0
			typing_miss_count = 0
			past_playing_time = 0
			escape_word_length = 0
		}
	}

	playing_time_current = past_playing_time
	StatusCountsUpdate(["Score","Rank","Type","Miss","Correct","Line","Escape"])
	if(typing_count){
		typing_speed_calculation()
	}else{
		SELECTOR_ACCESS_OBJECT['type-speed'].textContent = typing_speed.toFixed(2);
	}

}


let push_counter = 0
function practice_replay_mode(){
	let c = line_typinglog_log[count-1][push_counter][0]
	if(!kana_mode){
		if(checkNextChar(c,z_command_roma_mode(c,c,false,line_typinglog_log[count-1][push_counter][1]))){
			typing_count++
			combo++;
			if(max_combo < combo){max_combo = combo;}
			miss_combo = 0;
			if(!next_char[0]) { //ラインクリア時の打鍵速度調整
				completed = true;
				line_playing_time = clear_time_log[count-1]/speed
				line_clear_effect()
			}
			type_effect();
		}else if(!completed) {
			if(already_input_roma.length != 0) {
				typing_miss_count++
				combo=0;
				miss_combo++;
				if(score>0){
					score-=score_per_char/4
					line_score-=score_per_char/4
				}
			}
			miss_effect();
		}
	}else{
		if(checkNextKana(c)){
			typing_count++
			combo++;
			if(max_combo < combo){max_combo = combo;}
			miss_combo = 0;
			if(!next_char[0]) { //ラインクリア時の打鍵速度調整
				completed = true;
				line_playing_time = clear_time_log[count-1]/speed
			}
			type_effect();
		} else if(!completed) {
			if(already_input.length != 0) {
				typing_miss_count++
				combo=0;
				miss_combo++;
				if(score>0){
					score-=score_per_char/4
					line_score-=score_per_char/4
				}
			}
			miss_effect();
		}
	}

	push_counter++
	if(line_typinglog_log[count-1][push_counter] != undefined && (kana_mode && line_typinglog_log[count-1][push_counter][3] == "false\r" || !kana_mode && line_typinglog_log[count-1][push_counter][3] == "true\r")){
		input_mode_change()
	}
	StatusCountsUpdate(["Score","Rank","Type","Miss","Correct"])
	typing_speed_calculation()

}


function practice_reset(){
	let res = confirm("練習記録をリセットします。\n\n(練習記録は通常モードのプレイ終了時に一時的に保存され、ブラウザ(Chrome,Edgeなど)を終了するまで保持されます。)");
	if(res){
		if(document.getElementById("typing-line-list-container") != null){
			document.getElementById("typing-line-list-container").remove()
		}

		song_reset("practice")
		sessionStorage.removeItem(document.getElementById("movie_id").getAttribute('value'))
		sessionStorage.removeItem(document.getElementById("movie_id").getAttribute('value')+"score")

		typing_practice_generator()
	}
}


let last_seek_time = 0
let last_seek_line_count = -1
function typing_practice_generator(){

	let line_kpm_speed;
	let Typing_Line_List = "";
	number_lyrics = 1
	failer_count = 0

	var Result_div = document.createElement('section');
	Result_div.setAttribute("id", "typing-line-list-container");
	Result_div.setAttribute("class", "practice-mode");
	CONTROLBOX_SELECTOR.parentNode.insertBefore(Result_div, CONTROLBOX_SELECTOR.nextElementSibling);

	speedbutton.setAttribute("style", "float: right;display:block;margin-top:4px;width:auto;");
	speedbutton.childNodes[0].data = speedbutton.childNodes[0].data.replace("挑戦速度","速度切替")
	document.getElementById("typing-line-list-container").appendChild(speedbutton)
	document.getElementById("playspeed").textContent = speed.toFixed(2)+"倍速"
	var result_head_html = document.createElement('h1');
	result_head_html.setAttribute("id", "result-head");
	result_head_html.setAttribute("style", "font-size:20px;margin:0px!important;padding-bottom: 5px;padding-top: 10px;");
	result_head_html.innerHTML =
		`Typing Practice MODE <br><br>

<div id="practice_shortcutkeys"><div><kbd class="shortcut_navi" style="
    margin-right: 2px;
">Ctrl+←</kbd>現在のラインをセット / 前のラインをセット</div>
<div><kbd class="shortcut_navi" style="
    margin-right: 2px;
">Ctrl+→</kbd>次のラインをセット</div>
<div><kbd class="shortcut_navi" style="
    margin-right: 2px;
">Backspaceキー</kbd>セットしたラインへ</div></div>
<br>`
	document.getElementById("typing-line-list-container").appendChild(result_head_html)

	var practice_setting_html = document.createElement('div');
	practice_setting_html.setAttribute("id", "practice-setting");
	practice_setting_html.innerHTML =
		`<div title="ラインが切り替わる0.5秒前にライン未クリア状態だった場合、ラインクリアするまで動画を停止します。"><label><input type="checkbox" name="practice-stop">ラインクリアするまで動画を停止</input></label></div>
<label title="通過したラインをリプレイ再生します。" style="float: right;"><input type="checkbox" name="replay-mode">リプレイモード　</input></label><br>
<div title="一度もクリアしていないラインを通過すると練習ライン登録されます。"><label><input type="checkbox" name="seek-line-failed" checked>未クリアライン通過で登録</input></label></div>
<input style="float: right;margin-right: 14px;" type="button" value="練習記録をリセット" id="practice-reset" class="btn btn-light"></input><br>
<div title="0miss通過していないラインを通過すると練習ラインに登録されます。"><label><input type="checkbox" name="seek-line-miss">打鍵ミスしたラインを登録</input></label></div>
<br><br>`
	document.getElementById("typing-line-list-container").appendChild(practice_setting_html)
	document.getElementById("practice-reset").addEventListener("click",practice_reset)

	getAllIndexedDbData(loadIndexedDbData)


	var practicelog_html = document.createElement('ol');
	practicelog_html.setAttribute("id", "typing-line-result");
	practicelog_html.setAttribute("class", "practice-ilne-list");
	document.getElementById("typing-line-list-container").appendChild(practicelog_html)
	if(PHONE_FLAG){
		document.getElementById("playBotton3").parentNode.insertBefore(document.getElementById("playBotton3"),document.getElementById("result-head").nextSibling);
	}
	for(let i = 0; i < typing_array_kana.length; i++){
		if(typing_array_kana[i].length > 0){
			const necessary_key_push = !kana_mode ? roma_notes_list[i]:kana_notes_list[i]
			const line_time_speed = (lyrics_array[i+1][0]-lyrics_array[i][0])/DefaultPlaySpeed
			const necessary_typing_speed = necessary_key_push/line_time_speed
			const kana_line_word = typing_array_kana[i].join("")
			const mode_word = !kana_mode ? typing_array_roma[i].join("") : kana_line_word
			Typing_Line_List +=
`<li class="result_lyric" value="${+lyrics_array[i][0]}" number="${i}">
  <div class="typing_line">
    <div class='line_numbering'>
      <span class="zmdi zmdi-play-circle-outline zmdi-hc-fw">
</span>${ number_lyrics +`/`+ line_length } (<span class=necessary_key title=ライン打鍵数>${necessary_key_push}</span>打 ÷ <span class=necessary_time title=ライン時間>${line_time_speed.toFixed(1)}</span>秒 = <span class=necessary_kpm title=要求打鍵速度>${necessary_typing_speed.toFixed(2)}</span>打/秒)
      <span
        id="retry_number">0</span>ﾘﾄﾗｲ</div>
    <div><span class="kana_word_practice select_none">${kana_line_word}</span><span class="pass"></span></div>
  </div>
  <div class="typing_line_result">
    <div class='line-list-text-shadow daken_moji' style='font-weight:600;'>${mode_word}</div>
    <div><span class="statu_speed statu">打/秒: 0.00,　初速抜き: 0.00</span>,　miss: <span class="statu_miss">0</span>,　score: <span class="statu_score">0.00</span> / ${((roma_notes_list[i]*score_per_char)/2000).toFixed(2)}</div>
  </div>
</div>`
			number_lyrics ++
		}
	}

	document.getElementById("typing-line-result").insertAdjacentHTML('afterbegin',Typing_Line_List)




	for (let i = 0; i < document.querySelectorAll("#typing-line-list-container input").length; ++i) {
		document.querySelectorAll("#typing-line-list-container input")[i].addEventListener('click', function(event){
			if(event.target.type == "button"){
				return;
			}
			if(event.target.name != 'replay-mode'){
				saveModOption(event)
			}
			play_focus()
			OPTION_ACCESS_OBJECT[event.target.name] = document.getElementsByName(event.target.name)[0].checked;
			if(!finished && last_seek_line_count != count){
				practice_mode_status_update()
				document.getElementById("complete_effect").classList.remove('countdown_animation','count_animated')
				document.getElementById("complete_effect").textContent = OPTION_ACCESS_OBJECT['replay-mode'] && !seek_line_flag && line_typinglog_log[count-1].length > 1 ? "Replay":""
			}
		})
	}

	if(!OPTION_ACCESS_OBJECT['case-sensitive-mode']){
		const eleList = document.querySelectorAll("#typing-line-result .daken_moji")
		for (let i = 0; i < eleList.length; ++i) {
			eleList[i].classList.add('uppercase');//打鍵ログをuppercaseで表示。
		}
	}
	var line_result_head_html = document.createElement('div');
	line_result_head_html.setAttribute("id", "line-result-head");
	line_result_head_html.textContent = "Line Select List"
	document.getElementById("typing-line-result").parentNode.insertBefore(line_result_head_html, document.getElementById("typing-line-result"));

	const menus = document.getElementsByClassName("result_lyric");
	// 上記で取得したすべての要素に対してクリックイベントを適用
	for(let i = 0; i < menus.length; i++) {
		menus[i].addEventListener('click', function(event){
			last_seek_time = event.currentTarget.getAttribute('value')-1
			last_seek_line_count = +event.currentTarget.getAttribute('number') > 0 ?event.currentTarget.getAttribute('number')-1:+event.currentTarget.getAttribute('number')
			const clone = event.currentTarget.cloneNode(true)
			seek_practice_line(last_seek_time,last_seek_line_count)
			seek_line_set(clone)
			window.scrollTo({top:(document.documentElement.scrollTop+document.getElementsByClassName("result_lyric")[0].getBoundingClientRect().top+document.getElementsByClassName("result_lyric")[0].clientHeight+Number(document.getElementsByName('scroll-adjustment')[0].selectedOptions[0].value)-document.documentElement.clientHeight)})
			play_focus()
		})
	}


	if(sessionStorage.getItem(document.getElementById("movie_id").getAttribute('value'))){onLoadreplayFile()}

}

function onLoadreplayFile(){
	// A file was loaded.
	var listOfRuby = sessionStorage.getItem(document.getElementById("movie_id").getAttribute('value')).split('\n');

	play_speed = +listOfRuby[1]
	DefaultPlaySpeed = +listOfRuby[1]
	mapOfRuby = {};
	var v
	var v_num = 0
	var line_index = -1
	var line_log = []
	listOfRuby.forEach((ruby,index, array) => {
		if(ruby == "latency_kpm_rkpm_log\r"){
			v = "latency_kpm_rkpm_log"
			return true
		}else if(ruby == "escape_word_length_log\r"){
			v = "escape_word_length_log"
			v_num = 0
			return true
		}else if(ruby == "line_score_log\r"){
			v = "line_score_log"
			v_num = 0
			return true
		}else if(ruby == "clear_time_log\r"){
			v = "clear_time_log"
			v_num = 0
			return true
		}else if(ruby == "line_typing_count_miss_count_log\r"){
			v = "line_typing_count_miss_count_log"
			v_num = 0
			return true
		}else if(ruby == "line_typinglog_log\r"){
			v = "line_typinglog_log"
			v_num = 0


			return true
		}

		if(v == "latency_kpm_rkpm_log"){
			latency_kpm_rkpm_log.splice(v_num, 1, ruby.split(",").map(Number))
			v_num++
		}else if(v == "escape_word_length_log"){
			if(ruby[0] == ","){
				escape_word_length_log.splice(v_num, 1, ruby.split(","))
				escape_word_length_log[v_num][0] = ""
			}else{
				escape_word_length_log.splice(v_num, 1, ruby.split(","))
			}
			v_num++
		}else if(v == "line_score_log"){
			line_score_log.splice(v_num, 1, ruby.split(",").map(Number))
			v_num++
		}else if(v == "clear_time_log"){
			clear_time_log.splice(v_num, 1, Number(ruby))
			v_num++
		}else if(v == "line_typing_count_miss_count_log"){
			line_typing_count_miss_count_log.splice(v_num, 1, ruby.split(",").map(Number))
			v_num++
		}else if(v == "line_typinglog_log"){
			if(parseInt(ruby) != NaN && line_index - (+ruby) == -1){
				line_typinglog_log.splice(line_index, 1, line_log)
				line_index ++
				line_log = []
				v_num = 0
				return true
			}
			line_log.splice(v_num, 1, ruby.split(","))
			v_num++
		}


	});
	line_typinglog_log.forEach((typing,index, array) => {
		let clear_word = ""
		if(typing.length > 1){
			for(let i = 0; i < typing.length; i++){//入力した文字の数繰り返す
				if(typing[i][1] == 1){//正当
					clear_word += i > 0 && typing[i-1][1] == 0 ? '<span style="color:#FF3554;">'+typing[i][0].replace(' ', '⎽')+'</span>' : '<span style="color:#60d7ff;">'+typing[i][0].replace(' ', '⎽')+'</span>'
				}
			}
			clear_word += typing[typing.length-1][1] == 0 && escape_word_length_log[index][0] ? '<span style="color:#ae81ff;">'+escape_word_length_log[index][0][0].replace(' ', '⎽').replace(/</g, '&lt;')+'</span>'+escape_word_length_log[index][0].slice(1).replace(/</g, '&lt;') : escape_word_length_log[index][0].replace(/</g, '&lt;')
			document.querySelector('[number="'+[index]+'"] .statu_speed').classList.add('passed');
			document.querySelector('[number="'+[index]+'"] .statu_speed').textContent = '打/秒: '+latency_kpm_rkpm_log[index][1].toFixed(2)+',　初速抜き: '+latency_kpm_rkpm_log[index][2].toFixed(2)
			document.querySelector('[number="'+[index]+'"] .statu_miss').textContent = line_typing_count_miss_count_log[index][1]
			document.querySelector('[number="'+[index]+'"] .statu_score').textContent = (line_score_log[index][0]/2000).toFixed(2)
			if(!escape_word_length_log[index][0]){
				clear_word = clear_word.replace(/<span style="color:#60d7ff;">/g,'<span style="color:rgb(30, 255, 82);">')
			}
			document.querySelector('[number="'+[index]+'"] .daken_moji').innerHTML = clear_word
			document.querySelector('[number="'+[index]+'"] .pass').innerHTML = !escape_word_length_log[index][0] ? '<span class="seikou" style="color:#FFFF00;">clear</span>' : '<span class="sippai" style="color:#F12FFF;">failed</span>'

		}
	})
	for(let i = 0; i < escape_word_length_log.length; i++){//入力した文字の数繰り返す
		escape_word_length_log[i][1] = +escape_word_length_log[i][1]
	}
	practice_mode_status_update()
	typing_count_save = typing_count
}


function replay_mode_check(){
	document.getElementsByName('replay-mode')[0].checked = !document.getElementsByName('replay-mode')[0].checked
	OPTION_ACCESS_OBJECT['replay-mode'] = document.getElementsByName('replay-mode')[0].checked
	if(last_seek_line_count != count && play_mode == "practice"){
		document.getElementById("complete_effect").classList.remove('countdown_animation','count_animated')
		document.getElementById("complete_effect").textContent = OPTION_ACCESS_OBJECT['replay-mode'] && !seek_line_flag && line_typinglog_log[count].length > 1 ? "Replay":""
	}
}



function seek_practice_line_key_event(event){
	if( document.activeElement.tagName != "INPUT" && event.code=="Backspace"){
		seek_practice_line(last_seek_time,last_seek_line_count);
		event.preventDefault();
	}
}



function practice_failed_auto_set(){
	last_seek_time = document.querySelector('[number="'+(count-1)+'"]').getAttribute('value')-1
	last_seek_line_count = count-2>=0? count-2 : -1
	const clone = document.querySelector('[number="'+(last_seek_line_count+1)+'"]').cloneNode(true)
	seek_line_set(clone)
}

function practice_missline_auto_set(){
	const line_statu_speed = document.querySelector('[number="'+(count-1)+'"] .statu_speed')
	if(!line_statu_speed.classList.contains('passed') || line_typing_count_miss_count_log[count-1][1] > 0){
		clear_word = ""
		if(!line_statu_speed.classList.contains('passed')){
			const line_daken_moji = document.querySelector('[number="'+(count-1)+'"] .daken_moji')
			for(let i = 0; i < line_typinglog.length; i++){//入力した文字の数繰り返す
				if(line_typinglog[i][1] == 1){
					clear_word += i > 0 && line_typinglog[i-1][1] == 0 ? '<span style="color:#FF3554;">'+line_typinglog[i][0].replace(' ', '⎽')+'</span>' : '<span style="color:#60d7ff;">'+line_typinglog[i][0].replace(' ', '⎽')+'</span>'
				}
			}
			if(!kana_mode){
				clear_word +=('<span style="color:#ae81ff">'+next_char[1][0].replace(' ', '⎽')+'</span>')
				line_daken_moji.innerHTML = clear_word+next_char[1].slice(1)+line_input_roma.join("").replace(/</g, '&lt;')
			}else{
				clear_word +=('<span style="color:#ae81ff">'+next_char[0][0].replace(' ', '⎽')+'</span>')
				line_daken_moji.innerHTML = clear_word+line_input_kana.join("").replace(/</g, '&lt;')
			}
		}
		practice_failed_auto_set()
		falilue_line_set_count = count
	}
}

let X_Element = document.createElement("span");
X_Element.appendChild(document.createTextNode("✕"));
X_Element.setAttribute("id","seek_line_close");
X_Element.setAttribute("style","font-size: 145%;position:absolute;left:-20px;top:-4px;");

function seek_line_set(clone){
	if(document.getElementById("typing-line-list-container").children[2].className == "result_lyric"){
		document.getElementById("typing-line-list-container").children[2].parentNode.replaceChild(clone, document.getElementById("typing-line-list-container").children[2]);
	}else{
		document.getElementById("result-head").parentNode.insertBefore(clone, document.getElementById("result-head"));
	}


	if(document.getElementById("seek_line_close") == null){
		document.getElementById("typing-line-list-container").children[0].parentNode.insertBefore(X_Element, document.getElementById("typing-line-list-container").children[0]);
		document.getElementById("seek_line_close").addEventListener('click',seek_line_delete,true)
	}
	document.getElementById("typing-line-list-container").children[2].addEventListener('click', function(event){
		seek_practice_line(last_seek_time,last_seek_line_count)
		play_focus()
	})

	window.addEventListener('keydown',seek_practice_line_key_event,true);

}


function seek_line_delete(){
	window.removeEventListener('keydown',seek_practice_line_key_event,true);
	document.getElementById("seek_line_close").removeEventListener('click',seek_line_delete,true)
	document.getElementById("typing-line-list-container").children[2].remove()
	document.getElementById("seek_line_close").remove()

}


let seek_line_flag = false;

function seek_practice_line(seek_time,seek_line_count){
	if(next_char[0] && count){line_result_check()}
	if(count>last_seek_line_count){createjs.Ticker.removeEventListener("tick", playheadUpdate);
								  }
	count = seek_line_count
	if(!reset_flag){

		let number_of_times = +document.querySelector('[number="'+(+seek_line_count+(seek_time > -1 ?1:0))+'"] #retry_number').textContent
		number_of_times ++
		let now_number_selectorAll = document.querySelectorAll('[number="'+(seek_line_count+(seek_time > -1 ?1:0))+'"] #retry_number')
		for (let i = 0; i < now_number_selectorAll.length; ++i) {
			now_number_selectorAll[i].textContent = number_of_times;//打鍵ログをuppercaseで表示。
		}
	}
	push_counter = 0
	if(finished){ restore_playarea() }
	seek_line_flag = seek_time > -1 ? true:false

	if(seek_line_count > 0 ){
		line_input = typing_array[seek_line_count-1].slice();
		line_input_roma = typing_array_roma[seek_line_count-1].slice();
		line_input_kana = typing_array_kana[seek_line_count-1].slice();
	}else{
		line_input = typing_array[0].slice();
		line_input_roma = typing_array_roma[0].slice();
		line_input_kana = typing_array_kana[0].slice();
	}


	already_input = "";
	already_input_roma = "";
	next_char = "";
	practice_mode_status_update()
	if(!finishe_move){player.seekTo(seek_time+(1-speed))}
	finishe_move = false
	player.playVideo()

	const adjust_timer = setTimeout(function(){
		if(count >= seek_line_count){
			total_time_calculation()
			time_calculation(true)
			bar_base_update_count = 0
		}
	}, 30);


	countdown_anime = false
	seeked_count = 0
}














/////////////////////////////////////////////////////////////////////////////////////////////////
/**
*@プレイ終了時の関数変更 ここから---
*/

//プレイ終了
function gameover(){
	not_play_event()
	finished = true;
	stop_movie();
}






stop_movie = function () {

	player.seekTo(0)
	player.pauseVideo()
	SELECTOR_ACCESS_OBJECT['bar_base'].style.display = "none"
	SELECTOR_ACCESS_OBJECT['kashi'].style.display = "none"
	SELECTOR_ACCESS_OBJECT['kashi_roma'].style.display = "none"
	SELECTOR_ACCESS_OBJECT['kashi_sub'].style.display = "none"
	SELECTOR_ACCESS_OBJECT['kashi_next'].style.display = "none"
}

function not_play_event(){
	window.removeEventListener("keydown",key_device_disabled)
	createjs.Ticker.removeEventListener("tick", playheadUpdate);
	window.removeEventListener('keydown',keydownfunc,true);
	if(keyboard != "mac"){
		SELECTOR_ACCESS_OBJECT['skip-guide'].removeEventListener("click",press_skip,false)
	}
	if(SELECTOR_ACCESS_OBJECT['flick-input']){
		SELECTOR_ACCESS_OBJECT['flick-input'].removeEventListener('input',keydownfunc,true);
		SELECTOR_ACCESS_OBJECT['flick-input-second'].removeEventListener('input',keydownfunc,true);
		flick_input_max_value = ""
		SELECTOR_ACCESS_OBJECT['flick-input'].blur()
		SELECTOR_ACCESS_OBJECT['flick-input-second'].blur()
	}
}



let ending = false; //Typing Result生成フラグ

function typing_result_generator(){
	if(!ending){
		if(combo_challenge){
			localStorage.setItem('combo_challenge_roma' , (!typing_miss_count ? +localStorage.getItem('combo_challenge_roma')+roma_combo : roma_combo))
			localStorage.setItem('combo_challenge_kana' , (!typing_miss_count ? +localStorage.getItem('combo_challenge_kana')+kana_combo : kana_combo))

			const AFK = roma_combo ? 1:0
			localStorage.setItem('combo_challenge_fullcombo' , !typing_miss_count ? isNaN(+localStorage.getItem('combo_challenge_fullcombo')) ? 1 : +localStorage.getItem('combo_challenge_fullcombo')+AFK :AFK)
			if(AFK){	combo_challenge_beatmap_data.push([play_ID,play_Name,roma_combo,kana_combo,(score/2000).toFixed(2),typing_speed.toFixed(2),play_speed.toFixed(2),typing_count_roma_mode,typing_count_kana_mode,typing_count_flick_mode])}

			localStorage.setItem('combo_challenge_beatmap_data', JSON.stringify(combo_challenge_beatmap_data))
		}

		nothing_line_log.push([headtime,"", Math.round(score), count+1, 3, 2]);
		const word_result_flag = document.querySelector("[value=word-result]").checked
		let rkpm_speed = typing_count / (past_playing_time-total_latency)
		let typinglog_save = typinglog.concat(nothing_line_log)
		let word_result = ""
		let Typing_Result = '';
		number_lyrics = 1
		ending = true
		typinglog_save.sort( function(a,b) {return a[0] - b[0];} )

		var Result_div = document.createElement('section');
		Result_div.setAttribute("id", "typing-line-list-container");
		Result_div.setAttribute("class", "anim-box_slow fadein_slow is-animated_slow");
		CONTROLBOX_SELECTOR.parentNode.insertBefore(Result_div, CONTROLBOX_SELECTOR.nextElementSibling);

		var result_head_html = document.createElement('h1');
		result_head_html.setAttribute("id", "result-head");
		result_head_html.setAttribute("style", "font-size:20px;margin:0px!important;padding: 5px 0;font-weight:bold;");
		result_head_html.textContent = "Typing Result"
		document.getElementById("typing-line-list-container").appendChild(result_head_html)

		var typingLineResut_html = document.createElement('ol');
		typingLineResut_html.setAttribute("id", "typing-line-result");
		document.getElementById("typing-line-list-container").appendChild(typingLineResut_html)


		for(let i = 0; i <= typinglog_save.length-1; i++){//入力した文字の数繰り返す

			if(logcount == typinglog_save[i][3]){
				if(word_result_flag){
					if(typinglog_save[i][5] == 1){//正当
						word_result += i >= 1 && typinglog_save[i-1][5] == 0 && typinglog_save[i][3] == typinglog_save[i-1][3] ? '<span style="color:#FF3554;">'+typinglog_save[i][1].replace(' ', '⎽')+'</span>' : '<span style="color:#60d7ff;">'+typinglog_save[i][1].replace(' ', '⎽')+'</span>'
					}
				}else{
					word_result += typinglog_save[i][5] == 0 ? '<span style="color:#FF3554;">'+typinglog_save[i][1].replace(' ', '⎽')+'</span>' : '<span style="color:#60d7ff;">'+typinglog_save[i][1].replace(' ', '⎽')+'</span>'
				}
			}


			if(logcount < typinglog_save[i][3]){//ライン番号取得
				logcount = typinglog_save[i][3]
				word_result += typinglog_save[i-1][5] == 0 && escape_word_length_log[logcount-2][0] ? '<span style="color:#ae81ff;">'+escape_word_length_log[logcount-2][0][0].replace(' ', '⎽')+'</span>'+escape_word_length_log[logcount-2][0].slice(1) : escape_word_length_log[logcount-2][0]
				if(typinglog_save[i-1][4] != 3){//空白ラインは出現させない
					const necessary_key_push = !kana_mode ? roma_notes_list[logcount-2]:kana_notes_list[logcount-2]
					const line_time_speed = (lyrics_array[logcount-1][0]-lyrics_array[logcount-2][0])/DefaultPlaySpeed
					const necessary_typing_speed = necessary_key_push/line_time_speed
					const clear_failed = typinglog_save[i-1][4] == 1 && !escape_word_length_log[logcount-2][1] ? '<span class="seikou" style="color:#FFFF00;">clear</span>' : '<span class="sippai" style="color:#F12FFF;">failed</span>'

					if(typinglog_save[i-1][4] == 1 && !escape_word_length_log[logcount-2][1]){
						word_result = word_result.replace(/<span style="color:#60d7ff;">/g,'<span style="color:rgb(30, 255, 82);">');
					}

					Typing_Result +=
`<li class="result_lyric">
  <div style="font-size:80%;font-weight:normal;">${number_lyrics+'/'+line_length} (<span class=necessary_key>${necessary_key_push}</span>打 ÷ <span class=necessary_time>${line_time_speed.toFixed(1)}</span>秒 = <span class=necessary_kpm>${necessary_typing_speed.toFixed(2)}</span>打/秒)</div>
  <div><span class=select_none>${lyrics_array[logcount-2][2]+clear_failed}</div>
<div class='line-list-text-shadow daken_moji' style='font-weight:600;'>${word_result}</div>
<div>打/秒: ${latency_kpm_rkpm_log[logcount-2][1].toFixed(2)},　初速抜き: ${latency_kpm_rkpm_log[logcount-2][2].toFixed(2)},　miss: ${line_typing_count_miss_count_log[logcount-2][1]},　score: ${(line_score_log[logcount-2][0]/2000).toFixed(2)+' / '+((roma_notes_list[logcount-2]*score_per_char)/2000).toFixed(2)}</div>
</div>`
					number_lyrics++
					i--
				}
				word_result = ""
			}
		}


		document.getElementById("typing-line-result").insertAdjacentHTML('afterbegin',Typing_Result);

		if(!OPTION_ACCESS_OBJECT['case-sensitive-mode']){
			const eleList = document.querySelectorAll("#typing-line-result .daken_moji")
			for (let i = 0; i < eleList.length; ++i) {
				eleList[i].classList.add('uppercase');//打鍵ログをuppercaseで表示。
			}
		}

		var line_result_head_html = document.createElement('div');
		line_result_head_html.setAttribute("id", "line-result-head");
		line_result_head_html.textContent = "Line Result"
		document.getElementById("result-head").parentNode.insertBefore(line_result_head_html, document.getElementById("result-head").nextElementSibling);

		var rkpm_result_html = document.createElement('h4');
		rkpm_result_html.setAttribute("style", "font-size:120%;margin: 0px!important;padding-bottom: 5px;padding-top: 6px;");
		rkpm_result_html.innerHTML = "<div>初速抜き: "+rkpm_speed.toFixed(2)+"打/秒</div><br>"
		document.getElementById("result-head").parentNode.insertBefore(rkpm_result_html, document.getElementById("result-head").nextElementSibling);

		var score_result_html = document.createElement('h6');
		score_result_html.setAttribute("style", "font-size:130%;margin:0px!important;padding-bottom: 5px;");
		score_result_html.innerHTML = '<div><br><div>Score Penalty</div><div>Miss: '+ (-typing_miss_count*((parseInt(score_per_char)/2000)/4)).toFixed(2)+'</div><div>Esc: '+(( (score/2000) + (typing_miss_count*((score_per_char/2000)/4)))-100).toFixed(2).replace(/^[-]?(\d*|0)(\.01)?$/,'0.00')+'</div></div>'
		document.getElementById("result-head").parentNode.insertBefore(score_result_html, document.getElementById("result-head").nextElementSibling);

		var line_result_html = document.createElement('h5');
		line_result_html.setAttribute("id", "line_result");
		line_result_html.setAttribute("style", "margin:0px!important;padding-bottom: 5px;");
		line_result_html.innerHTML = '<span style="color:#FFFF00;">'+document.querySelectorAll(".seikou").length+' clear</span> / <span style="color:#FFFF00;"><span style="color:#F12FFF;">'+document.querySelectorAll(".sippai").length+' failed</span>'
		document.getElementById("result-head").parentNode.insertBefore(line_result_html, document.getElementById("result-head").nextElementSibling);
		const movie_number = document.getElementById("movie_id").getAttribute('value')
		if((score/2000) > sessionStorage.getItem(movie_number+"score")){
			sessionStorage.setItem(movie_number+"score",(score/2000))
			replay_generator(movie_number)
		}


	}
}


//プレイリザルトで表示するstatus
function typing_result_status(){

const gameover_flag = ( OPTION_ACCESS_OBJECT['miss-limit-game-mode'] && correct < OPTION_ACCESS_OBJECT['miss-limit-correct'] || !OPTION_ACCESS_OBJECT['miss-limit-game-mode'] && life_correct < 0 ) ? true:false
	if(OPTION_ACCESS_OBJECT['status-mode']){
		document.getElementById("status").style.height = "initial"
		document.getElementById("status").style.lineHeight = "42.4px"
		document.getElementById("status").innerHTML =
`
<div class='flex_space_between'>
<span id='score-value'>`+(score/2000).toFixed(2)+`</span>
<span style="`+(ranking_array.length ? "" : "display:none;")+`font-size:90%;" class='rank'><span id='rank_score'>`+ (now_rank+1) + `</span><span class="status_name"'>位</span></span>
</div>

<div class="status_border"></div>

<div id="miss_area">

<div id='miss_life'>
<span id="miss"><span id='miss_score'>`+typing_miss_count + `</span><span class="status_name">miss</span></span></span>
`+(OPTION_ACCESS_OBJECT['miss-limit-mode'] && !OPTION_ACCESS_OBJECT['miss-limit-game-mode'] ? `<span id="life" style="`+(gameover_flag ? "color:#FF4B00!important;":"color:gold;")+`"><span id='life_correct_text'>`+life_correct.toFixed(1)+`</span><span class="status_name">life</span></span>`:"")+`
</div>

<div class='correct correct_sub' style='padding-top: 8px;display:block;'>
<span style='font-size:75%;font-weight:normal;'>正確率:</span><span id='correct_text' style='font-size:85%;'><span id='correct_score'>`+correct+`</span>%
`+(OPTION_ACCESS_OBJECT['miss-limit-mode'] ? `<span id='keep' style="padding-left:9px;`+(gameover_flag ? "color:#FF4B00;":"color:gold;")+`"><span id='keep_correct_score'>`+(OPTION_ACCESS_OBJECT['miss-limit-mode'] ? keep_correct.toFixed(1) :"")+`</span>%</span>`:"")+`</span>
</div>

</div>

<div class="status_border"></div>

<div><span style="font-size: 85%;">`+max_combo+`<span class="status_name">combo</span></span></div>

<div class="status_border"></div>

<div style="font-size:85%;"><span><span id='typing-count-value'>`+typing_count + `</span><span class="status_name">打</span></span> / <span><span id='escape-value'>` +escape_word_length + `</span><span class="status_name">逃し</span></span></div>

</div>

<div class="status_border"></div>

<div style="font-size:85%;"><span id='type-speed'>`+typing_speed.toFixed(2)+`</span><span class="status_name">打/秒</span></div>
`;


	}else{


		document.getElementById("status").innerHTML = `<table style="width:100%;table-layout: fixed;position: relative;right: -82px;">
<tr id=statu1dan style='height: 4rem;'>

<td><span class='status_label' style="left: -48px;">Score</span>
<span class="flex_status_position"><span id='score-value'>`+(score/2000).toFixed(2)+`</span><span class="flex_status_border"></span></span>
</td>

<td class='miss'><span class='status_label' >Miss</span>
`+(OPTION_ACCESS_OBJECT['miss-limit-mode'] && !OPTION_ACCESS_OBJECT['miss-limit-game-mode'] ? `<span id="life" style="position: absolute;left: -48px;line-height: 10px;top: -2px;`+(gameover_flag ? "color:#FF4B00!important;":"color:gold;")+`"><span id='life-value'>`+life_correct.toFixed(1)+`</span></span>`:"")+`

<span class="flex_status_position"><span id='miss-value'>`+typing_miss_count+`</span><span class="flex_status_border"></span></span>
</td>

<td class='escape-counter'><span class='status_label'>Lost</span>
<span class="flex_status_position"><span id='escape-value'>`+escape_word_length + `</span><span class="flex_status_border"></span></span>
</td>

<td class='typing-speed'><span class='status_label' style='font-weight:normal;left: -42px;'>打/秒</span>
<span class="flex_status_position"><span id='type-speed'>`+typing_speed.toFixed(2)+`</span><span class="flex_status_border"></span></span>
</td>
</tr>

<tr id=statu2dan style='height: 4rem;'>
<td class='rank'><span class='status_label' style="left: -45px;">Rank</span>
<span class="flex_status_position"><span id='rank-value'>`+ (now_rank+1) + `</span><span style='font-weight:normal;'>位</span><span class="flex_status_border"></span></span>
</td>


<td class='correct'><span class='status_label' style='font-size:65%;font-weight:normal;left: -45px;'>正確率</span>
<span id="keep" style="display:`+(OPTION_ACCESS_OBJECT['miss-limit-mode'] ? "block":"none")+`;`+(gameover_flag ? "color:#FF4B00!important;":"color:gold;")+`padding-left:9px;position: absolute;left: -53px;line-height: 10px;top: 0;"><span id="keep-value">`+(OPTION_ACCESS_OBJECT['miss-limit-mode'] ? keep_correct.toFixed(1) :"")+`</span>%</span>
<span class="flex_status_position"><span style='font-size:90%;'><span id='correct-value'>`+correct+`</span>%</span><span class="flex_status_border"></span></span>
</td>

<td class='type-counter'><span class='status_label' style='left: -43px;'>Type</span>
<span class="flex_status_position"><span id='typing-count-value'>`+typing_count + `</span><span class="flex_status_border"></span></span>
</td>

<td class='remaining-line-counter'><span class='status_label' style="left: -60px;"><span id='normal_line_change' >Combo</span></span>
<span class="flex_status_position"><span id='line-count-value'>` +max_combo+`</span><span class="flex_status_border"></span></span>
</td>
</tr>
</table>`;
	}
}


function replay_generator(movie_number){
	let csvData = ""
	csvData += movie_number+"\r\n"+play_speed+"\r\n"+(kana_mode ? "kana_mode\r\n" : "roma_mode\r\n")+"latency_kpm_rkpm_log\r\n"

	for(let i=0;i<latency_kpm_rkpm_log.length;i++){
		let latency_kpm_rkpm = latency_kpm_rkpm_log[i].join(",");
		csvData += latency_kpm_rkpm + "\r\n";
	}

	csvData += "escape_word_length_log\r\n"
	for(let i=0;i<escape_word_length_log.length;i++){
		let escape_word_length
		escape_word_length = escape_word_length_log[i].join(",");
		csvData += escape_word_length + "\r\n";

	}

	csvData += "line_score_log\r\n"
	for(let i=0;i<line_score_log.length;i++){
		let line_score = line_score_log[i];
		csvData += line_score + "\r\n";
	}

	csvData += "clear_time_log\r\n"
	for(let i=0;i<clear_time_log.length;i++){
		let clear_time = clear_time_log[i];
		csvData += clear_time + "\r\n";
	}

	csvData += "line_typing_count_miss_count_log\r\n"
	for(let i=0;i<line_typing_count_miss_count_log.length;i++){
		let line_typing_count_miss_count = line_typing_count_miss_count_log[i].join(",");
		csvData += line_typing_count_miss_count + "\r\n";
	}

	csvData += "line_typinglog_log\r\n"
	for(let i=0;i<line_typinglog_log.length;i++){
		csvData += i+"\r\n";
		if(!line_typinglog_log[i].length){
			csvData += "\r\n";
		}
		for(let j=0;j<line_typinglog_log[i].length;j++){
			let line_typinglog = line_typinglog_log[i][j].join(",");
			csvData += line_typinglog + "\r\n";
		}
	}
	sessionStorage.setItem(movie_number, csvData);

}









//preview video

let control_enable = 1
let humenID = 0
let request_videoid = ""
let img_selector
let td_flag = false
let resize_dom
let hover_id = 0
let hover_request_videoid = ""
let demo_player_html = document.createElement('div');
demo_player_html.setAttribute("id", "player_demo");
let start_time = 0
let img_height_size = 0
let img_width_size = 0
let preview_time = 0

let transparent_cover = document.createElement('a');
transparent_cover.setAttribute("id", "transparent_cover");

let loading_html = document.createElement('span');
loading_html.setAttribute("id", "loading_logo");
loading_html.setAttribute("class", "loader");





let demo_speed_title
function set_preview_video(){
	if(event.key == "Shift"){
		if(hover_id && hover_id[0] != humenID[0]){
			humenID = hover_id
			$.ajax({
				type: 'POST',
				url: '/movie/lyrics/' + humenID,
				success:function(data){
					const data_split = data.split("\n")
					start_time = -1
					demo_speed_title = data_split[0].match(/^【\d?\.?\d?\d倍速】/)
					if(demo_speed_title){
						demo_speed_title = parseFloat(demo_speed_title[0].slice(1))
						if(!speed_Fixed.includes(demo_speed_title)){
							demo_speed_title = false
						}
					}
					for(let i=0;i<data_split.length;i++){
						if(i>0){
							if(start_time == -1 && data_split[i].split("\t")[2]){
								start_time = Math.floor(+data_split[i].split("\t")[0])
								preview_time = +data_split[i].split("\t")[0]
							}else if(data_split[i].split("\t")[0].substr( -5, 1 ) == "."){
								start_time = Math.floor(+data_split[i].split("\t")[0])
								preview_time = +data_split[i].split("\t")[0]
								break;
							}
						}
					}
					demo_video_delete()
					if(timeline_flag){
						transparent_cover.setAttribute("style", "position:absolute;left: 0;right: 0;margin: auto;");
						demo_player_html.setAttribute("style", "position:absolute;left: 0;right: 0;margin: auto;z-index:1;opacity: 0;");
					}else{
						demo_player_html.setAttribute("style", "position:absolute;opacity: 0;");
						transparent_cover.setAttribute("style", "position:absolute;z-index:1;");
					}
					onYouTubeIframeAPIReady_demo(data.match(/(v=).*\n/)[0].slice(2))
				}
			});
		}
	}
}



var player_demo
let username_selector
function onYouTubeIframeAPIReady_demo(preview_videoid) {
	if(td_flag){
		img_height_size = 60
		img_width_size = 90
		td_flag.insertAdjacentHTML('beforebegin', `<div id="player_demo" style="position:absolute;"></div>`)
		document.getElementById("player_demo").parentNode.insertBefore(transparent_cover, document.getElementById("player_demo"));
		document.getElementById("transparent_cover").appendChild(loading_html);
		document.getElementById("loading_logo").style.top = "42px"
		document.getElementById("loading_logo").style.left = "88%"
		transparent_cover.style.height = (img_height_size)+"px"
		transparent_cover.style.width = (img_width_size)+"px"
	}else{
		img_height_size = img_selector.height
		img_width_size = img_selector.width

		if(timeline_flag){
			img_selector.parentNode.classList.add('col-12');
			username_selector = img_selector.parentNode.querySelector(".username")
			demo_player_html.style.top = (parseInt(getComputedStyle( username_selector, null ).marginBottom)+username_selector.offsetHeight)+"px"
			transparent_cover.style.top = (parseInt(getComputedStyle( username_selector, null ).marginBottom)+username_selector.offsetHeight)+"px"
		}
		transparent_cover.style.height = (img_height_size)+"px"
		transparent_cover.style.width = (img_width_size)+"px"
		transparent_cover.setAttribute("href", "https://typing-tube.net/movie/show/"+humenID);
		img_selector.parentNode.insertBefore(demo_player_html, img_selector);
		img_selector.parentNode.insertBefore(transparent_cover, img_selector);
		document.getElementById("transparent_cover").appendChild(loading_html);


		document.getElementById("loading_logo").style.top = ""
		document.getElementById("loading_logo").style.left = ""
		document.getElementById("transparent_cover").addEventListener("mousedown",mouseclick_event,true)
		demo_player_html = document.getElementById("player_demo").cloneNode(true)
		resize_dom = img_selector.parentNode.querySelector("img[src*='i.ytimg.com']")
	}

	player_demo = new YT.Player('player_demo', {
		height: img_height_size ,
		width: img_width_size ,
		playerVars: {
			autoplay: 1,
			disablekb: 1,
			modestbranding:1,
			origin: location.protocol + '//' + location.hostname + "/",
			start: start_time
		},
		videoId: preview_videoid,
		events: {
			'onReady': onPlayerReady_demo,
			'onStateChange': onPlayerStateChange_demo

		}
	});
}

function onPlayerReady_demo(event) {
	player_demo.setVolume(+localStorage.getItem('volume_storage'))
	window.addEventListener('keydown',keydown_et,true);
	player_demo.seekTo(preview_time-0.07)

}

function onPlayerStateChange_demo(event) {
	if(player_demo){
		if(event.data == 0){
			demo_video_delete()

		}else if(event.data == 1){
			if(demo_speed_title){
				player_demo.setPlaybackRate(demo_speed_title);
			}
			document.getElementById("player_demo").style.opacity = 1
			if(resize_dom){resize_dom.style.opacity = 0}

		}else if(event.data == -1){

		}
	}
}


function keydown_et(event){
	if(event.key == "Escape"){
		demo_video_delete()
		humenID = 0
		if(!img_selector){
			hover_id = 0
		}
		window.removeEventListener('keydown',keydown_et,true);
	}
}

function demo_video_delete(){
	if(player_demo){
		if(resize_dom){
			resize_dom.style.opacity = 1
			resize_dom = 0
		}
		document.getElementById("loading_logo").remove()
		document.getElementById("player_demo").remove()
		player_demo = false
	}
}








//Set EventListener

window.addEventListener( 'resize', function() {
	if(resize_dom && document.getElementById("player_demo") != null && img_height_size != 60){
		img_height_size = resize_dom.height
		img_width_size = resize_dom.width
		document.getElementById("transparent_cover").style.height = img_height_size+"px"
		document.getElementById("transparent_cover").style.width = img_width_size+"px"
		document.getElementById("player_demo").setAttribute("height",img_height_size)
		document.getElementById("player_demo").setAttribute("width",img_width_size)
		if(timeline_flag){
			document.getElementById("player_demo").style.top = (parseInt(getComputedStyle( username_selector, null ).marginBottom)+username_selector.offsetHeight)+"px"
			document.getElementById("transparent_cover").style.top = (parseInt(getComputedStyle( username_selector, null ).marginBottom)+username_selector.offsetHeight)+"px"
		}
	}
}, false );
window.addEventListener("keyup", set_preview_video,true);



//Create Volume Control
document.getElementsByTagName("section")[1].children[0].insertAdjacentHTML('afterbegin', `<style>
.loader,
.loader:before,
.loader:after {
  background: #ffffff;
  -webkit-animation: load1 1s infinite ease-in-out;
  animation: load1 1s infinite ease-in-out;
  width: 1em;
  height: 4em;
}
.loader {
left: 95%;
    top: -20px;
  color: #ffffff;
  text-indent: -9999em;
  z-index:1;
  position: absolute;
  font-size: 3px;
  -webkit-transform: translateZ(0);
  -ms-transform: translateZ(0);
  transform: translateZ(0);
  -webkit-animation-delay: -0.16s;
  animation-delay: -0.16s;
}
.loader:before,
.loader:after {
  position: absolute;
  top: 0;
  content: '';
}
.loader:before {
  left: -1.5em;
  -webkit-animation-delay: -0.32s;
  animation-delay: -0.32s;
}
.loader:after {
  left: 1.5em;
}
@-webkit-keyframes load1 {
  0%,
  80%,
  100% {
    box-shadow: 0 0;
    height: 4em;
  }
  40% {
    box-shadow: 0 -2em;
    height: 5em;
  }
}
@keyframes load1 {
  0%,
  80%,
  100% {
    box-shadow: 0 0;
    height: 4em;
  }
  40% {
    box-shadow: 0 -2em;
    height: 5em;
  }
}
#player_demo{
    z-index: 2;
}
</style><div style="
    background: #111111b5;
    padding: 3px 7px 2px 7px;
    border-radius: 11px;
    margin-left: 13px;
margin-top:4rem;" id="preview_shortcut" `+(PHONE_FLAG ? `style="visibility:hidden;"`:"")+`>
[再生したい動画にカーソルを合わせてShiftキー:再生] / [再生中にEscapeキー:停止]</div>`)
//Set Mouse EventListener
let timeline_flag = false
function get_img(event){
	const find_selector_word = ["timeline","mt-3","col"]
	for(let i=0;i<find_selector_word.length;i++){
		if(event.target.closest("[class*="+find_selector_word[i]+"]") && event.target.closest("[class*="+find_selector_word[i]+"]").querySelector("img[src*='i.ytimg.com']")){
			if(find_selector_word[i] == "timeline"){
				timeline_flag = true
			}else{
				timeline_flag = false
			}
			return event.target.closest("[class*="+find_selector_word[i]+"]").querySelector("img[src*='i.ytimg.com']")
		}
	}
	return false
}

function mouseover_event(event) {
	img_selector = get_img(event)
	td_flag = event.target.closest("[style*='i.ytimg.com']") ? event.target.closest("[style*='i.ytimg.com']"):false
	hover_id = event.currentTarget.href.match(/[0-9]+\.?[0-9]*/)
}
function mouseout_event(event) {
	img_selector = false
	td_flag = false
	hover_id = humenID
}

function mouseclick_event(event){
	if(event.shiftKey || event.ctrlKey || event.button == 2){
		humenID = 0
		hover_id = 0
		demo_video_delete()
	}
}

function eventlistener(){
	let typing_link = document.querySelectorAll("[href*='movie/show/']")
	for(let n = 0; n < typing_link.length ; n++){
		typing_link[n].addEventListener("mouseover",mouseover_event,true)
		typing_link[n].addEventListener("mouseout",mouseout_event,true)
		typing_link[n].addEventListener("mousedown",mouseclick_event,true)
	}
}
eventlistener();
