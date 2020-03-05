import React, { ReactNode } from "react";
import { google } from 'googleapis';

import listenSpotifyImg from '../assets/img/listen-on-spotify.png';

require('../styles/components/performance.scss');

interface IProps {
    spotifyToken?: string;
    youtubeApiKey?: string;

    artist: string;
    startTime?: Date;
    endTime?: Date;
    scene?: string;
    genres?: string[];
    tags?: string;
}

interface IState {
    loaded: boolean;
    error: "none" | "couldNotFindArtist";
    artistImgUrl?: string;
    artistSpotifyUrl?: string;
}

export default class Performance extends React.Component<IProps, IState> {
    private topTracksYtbId: string[] = [];


    constructor(props: IProps) {
        super(props);

        this.state = {
            loaded: false,
            error: "none"
        }
    }

    async componentDidMount(){
        const escapedArtistName: string = this.props.artist.replace(/\s/g, '%20');
        let artistImgUrl: string | undefined = undefined;
        let artistSpotifyUrl: string | undefined = undefined;

        // Getting the artist id from Spotify
        const respArtists = await fetch("https://api.spotify.com/v1/search?q="+escapedArtistName+"&type=artist", {
            headers: {
                Authorization: 'Bearer ' + this.props.spotifyToken
            },
            method: "GET"
        }).then((r) => r.json());

        if(respArtists.artists.items.length <= 0){
            this.setState({
                error: 'couldNotFindArtist'
            });

            return;
        }

        const artistInfos = respArtists.artists.items[0];
        console.log();

        // Getting the artist image
        if(artistInfos.images.length > 1){
            artistImgUrl = artistInfos.images[1].url;
        }

        // Getting the artist Spotify url
        if(artistInfos.external_urls.spotify){
            artistSpotifyUrl = artistInfos.external_urls.spotify;
        }

        // Getting the top tracks of the artist
        const respTracks = await fetch("https://api.spotify.com/v1/artists/"+artistInfos.id+"/top-tracks?country=US", {
            headers: {
                Authorization: 'Bearer ' + this.props.spotifyToken
            },
            method: "GET"
        }).then((r) => r.json());

        for(let i = 0; i < 3 && i < respTracks.tracks.length; ++i){
            this.topTracksYtbId.push(await this.getYoutubeVideoId(this.props.artist, respTracks.tracks[i].name));
        }
        

        this.setState({
            loaded: true,
            artistImgUrl,
            artistSpotifyUrl
        })
    }

    render() {
        if(!this.props.spotifyToken){
            return <div className="performance">Spotify Token not found.</div>
        }

        if(!this.state.loaded){
            return <div className="performance">Loading...</div>
        }


        return (
            <div className="performance">
                <a target="_blank" href={this.state.artistSpotifyUrl}>
                    <div className="artist-title">
                        <div className="artist-img" style={{ background: "url("+this.state.artistImgUrl+") center / cover no-repeat"}}>
                            <h2>{this.props.artist}</h2>
                            <div className="listen-spotify-btn"><img src={listenSpotifyImg} /></div>
                        </div>
                    </div>
                </a>
                <div>
                    {this.createTopTracksPlayers()}
                </div>
            </div>
        );
    }

    private createTopTracksPlayers(): JSX.Element[] {
        const result: JSX.Element[] = []; 
        for(let ytbId of this.topTracksYtbId){
            result.push(
                <div>
                    <iframe id="ytplayer" width="270" height="200"
                        src={"https://www.youtube.com/embed/"+ytbId} />
                </div>);
        }

        return result;
    }

    private async getYoutubeVideoId(artistName: string, trackName: string){
        const escapedSearch: string = artistName.replace(/\s/g, '%20') + "%20" + trackName.replace(/\s/g, '%20');

        const resp = await fetch("https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=25&q="+escapedSearch+"&key="+this.props.youtubeApiKey, {
            headers: {
                Accept: "application/json",
            }
        }).then((r) => r.json());

        return resp.items[0].id.videoId;
    }
}