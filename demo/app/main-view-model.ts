import {Observable, EventData} from 'data/observable';
import {Page} from 'ui/page';
import {topmost} from 'ui/frame';
import {AnimationCurve} from 'ui/enums';
import * as loader from 'nativescript-loading-indicator';
import {TNSSpotifyConstants, TNSSpotifyAuth, TNSSpotifyPlayer, TNSSpotifyPlaylist, TNSSpotifyRequest, Utils} from 'nativescript-spotify';

export class SpotifyDemo extends Observable {
  public footerNote: string = "<span style='font-family: sans-serif; background-color:#000; color:#fff;'>Demo by <a href='https://github.com/NathanWalker' style='color:#A6CE40;'>Nathan Walker</a></span>";
  public playBtnTxt: string;
  public spotify: TNSSpotifyPlayer;
  public loggedIn: boolean = false;
  public accountName: string;
  public albumUrl: string;
  public trackInfo: string;
  public playing: boolean = false;
  public trackLoaded: boolean = false;
  public currentAlbumUrl: string;
  public albumName: string;
  public albumUri: string;
  public artistName: string;
  public artistUri: string;
  public trackDuration: string;
  public trackName: string;
  public trackUri: string;
  public playlistItems: Array<any>;
  public metadataBtnTxt: string;
  public accountInfoBtnTxt: string;
  public playlistNSActive: string;
  public playlistTRActive: string;
  private _metadataVisible: boolean = false;
  private _chevronDown: string = `\uf13a`;
  private _chevronUp: string = `\uf139`;
  private _accountInfoVisible: boolean = false;
  private _userIcon: string = `\uf007`;
  private _userIconClose: string = `\uf235`;
  private _currentTrack: string;
  private _playlistOpen: boolean = false;
  private _playlistItemPlayingIndex: number = -1;

  constructor() {
    super();
    
    // init player
    loader.show();
    this.spotify = new TNSSpotifyPlayer();
    this.spotify.initPlayer(true);
    this.setupEvents();

    this.playBtnTxt = `\uf144`;
    this.currentAlbumUrl = `~/assets/logo.jpg`;
    this.metadataBtnTxt = this._chevronDown;
    this.accountInfoBtnTxt = this._userIcon;
    this.playlistNSActive = this.playlistTRActive = '#ffffff';
  }
  
  public login() {
    TNSSpotifyAuth.LOGIN();
  }
  
  public logout() {
    if (this.playing) {
      this.togglePlay();
      this.toggleAccountInfo(null, false);
      this.set(`currentAlbumUrl`, `~/assets/logo.jpg`);
    }
    TNSSpotifyAuth.LOGOUT();
  }
  
  public togglePlay(args?: EventData, trackUri?: string) {
    loader.show();
    
    if (!this._currentTrack && !trackUri) {
      // first play if not using playlist right away is a surprise :)
      trackUri = 'spotify:track:58s6EuEYJdlb0kO7awm3Vp';
    } 
    
    // only set current track if there's a track coming in
    if (trackUri) this._currentTrack = trackUri;

    this.spotify.togglePlay(this._currentTrack).then((isPlaying: boolean) => {
      loader.hide();
      this.set(`trackLoaded`, true);
      this.set(`playing`, isPlaying);
      this.toggleBtn();  
      this.togglePlaylist(false);
    }, (error) => {
      loader.hide();
      this.set(`trackLoaded`, false);
      this.set(`playing`, false);
      this.toggleBtn();  
      if (error === 'login') {
        this.set(`loggedIn`, false);
      }
    });
  }
  
  public updateTrackInfo() {
    let metadata = this.spotify.currentTrackMetadata();
    this.set(`albumName`, `Album: ${metadata.albumName}`);
    this.set(`albumUri`, `Album URI: ${metadata.albumUri}`);
    this.set(`artistName`, `Artist: ${metadata.artistName}`);
    this.set(`artistUri`, `Artist URI: ${metadata.artistUri}`);
    this.set(`trackDuration`, `Duration: ${metadata.trackDuration}`);
    this.set(`trackName`, `Track: ${metadata.trackName}`);
    this.set(`trackUri`, `Track URI: ${metadata.trackUri}`);
  }
  
  public viewPlaylist(args: EventData, uri?: string) {
    if (!this._playlistOpen) {
      loader.show();
      if (uri) {
        this.set('playlistTRActive', '#A6CE40');
        this.set('playlistNSActive', '#ffffff');
      } else {
        this.set('playlistTRActive', '#ffffff');
        this.set('playlistNSActive', '#A6CE40');
      }
      TNSSpotifyRequest.ITEM(uri || 'spotify:user:burkeholland:playlist:6kWBeWiaRT7zjINBJJtxJb').then((item) => {
        loader.hide();
        console.log(item); // SPTPlaylistList
        let tracks = TNSSpotifyRequest.TRACKS_FROM_PLAYLIST(item);
        this.set(`playlistItems`, tracks);
        this.togglePlaylist();
      });
    } else {
      this.togglePlaylist();
    }
  }

  public viewThoughtram(args: EventData) {
    this.viewPlaylist(args, 'spotify:user:pascalprecht:playlist:6tTtJJTxkrp9Qnz5afZzpz');
  }

  public playlistItemTap(args: EventData) {
    if (this._playlistItemPlayingIndex === args.index) {
      // pause track
      this.playlistItems[this._playlistItemPlayingIndex].playing = false;
      let id = this.playlistItems[this._playlistItemPlayingIndex].identifier;
      console.log(id);
      this.togglePlay(null, `spotify:track:${id}`);
    } else {
      this._playlistItemPlayingIndex = args.index;
      for (let item of this.playlistItems) {
        item.playing = false;
      }
      this.playlistItems[this._playlistItemPlayingIndex].playing = true;
      let id = this.playlistItems[this._playlistItemPlayingIndex].identifier;
      console.log(id);
      this.togglePlay(null, `spotify:track:${id}`);
    }
    this.set(`playlistItems`, this.playlistItems);  
  }
  
  public toggleMetadata(args: EventData, force?: boolean) {
    let toggleOther = true;
    if (typeof force !== 'undefined') {
      toggleOther = false;
      this._metadataVisible = force;
    } else {
      this._metadataVisible = !this._metadataVisible;  
    }
    let page = topmost().currentPage;
    let metadata = page.getViewById('metadata');
    metadata.animate({
      translate: { x: 30, y: this._metadataVisible ? 0 : -300 },
      opacity:  this._metadataVisible ? .8 : 0,
      duration: 300
    });
    this.set(`metadataBtnTxt`, this._metadataVisible ? this._chevronUp : this._chevronDown);
    if (toggleOther) this.toggleAccountInfo(null, false);
  }
  
  public toggleAccountInfo(args: EventData, force?: boolean) {
    let toggleOther = true;
    if (typeof force !== 'undefined') {
      toggleOther = false;
      this._accountInfoVisible = force;
    } else {
      this._accountInfoVisible = !this._accountInfoVisible;  
    }
    let page = topmost().currentPage;
    let accountInfo = page.getViewById('account-info');
    accountInfo.animate({
      translate: { x: 30, y: this._accountInfoVisible ? 0 : -300 },
      opacity:  this._accountInfoVisible ? .8 : 0,
      duration: 300
    });
    this.set(`accountInfoBtnTxt`, this._accountInfoVisible ? this._userIconClose : this._userIcon);
    if (toggleOther) this.toggleMetadata(null, false);
  }
  
  private toggleBtn() {
    this.set(`playBtnTxt`, this.playing ? '\uf28b' : '\uf144');
  }
  
  private togglePlaylist(force?: boolean) {
    // EXPERIMENTATION
    // this._playlistOpen = typeof force !== 'undefined' ? force : !this._playlistOpen;
    // let page = topmost().currentPage;
    // let albumArt = page.getViewById('album-art');
    // let playlistView = page.getViewById('playlist');
    // let scale = this._playlistOpen ? .5 : 1;
    // let yVal = this._playlistOpen ? -100 : 0;
    // let yPLVal = this._playlistOpen ? -200 : 0;
    // albumArt.animate({
    //   translate: { x: 0, y: yVal },
    //   scale: { x: scale, y: scale },
    //   duration: 400,
    //   curve: AnimationCurve.easeOut
    // });
    // playlistView.animate({
    //   translate: { x: 0, y: yPLVal },
    //   duration: 400,
    //   curve: AnimationCurve.easeOut
    // });
  }
  
  private updateAlbumArt(url: string) {
    this.set(`currentAlbumUrl`, url);
    this.updateTrackInfo();
  }
  
  private updateLogin(status: boolean) {
    this.set(`loggedIn`, status);
    this.setUsername();
  }
  
  private loginCheck() {
    loader.show();
  }
  
  private loginSuccess() {
    this.set(`loggedIn`, true);
    console.log(`loginSuccess!`);
    loader.hide();
    this.setUsername();
  }
  
  private playerReady() {
    loader.hide();
  }
  
  private setUsername() {
    TNSSpotifyAuth.CURRENT_USER().then((user) => {
      console.log(user);
      this.set(`accountName`, user.displayName);
    }, () => {
      this.set(`accountName`, '');
    })
  }

  private setupEvents() {
    this.spotify.audioEvents.on('albumArtChange', (eventData) => {
      this.updateAlbumArt(eventData.data.url);
    });
    this.spotify.audioEvents.on('authLoginChange', (eventData) => {
      this.updateLogin(eventData.data.status);
    });
    this.spotify.audioEvents.on('authLoginCheck', (eventData) => {
      this.loginCheck();
    });
    this.spotify.audioEvents.on('authLoginSuccess', (eventData) => {
      this.loginSuccess();
    });
    this.spotify.audioEvents.on('playerReady', (eventData) => {
      this.playerReady();
    });
  }  
}