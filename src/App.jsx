import React, { useState, useEffect } from "react";
import "./index.css";

import { PageTemplate } from "./components/PageTemplate";
import { Search } from "./components/Search";
import { PlayerTemplate } from "./components/PlayerTemplate";
import { TitleAndTimeBox } from "./components/TitleAndTimeBox";
import { Cover } from "./components/Cover";
import { Title } from "./components/Title";
import { Time } from "./components/Time";
import { Progress } from "./components/Progress";
import { ButtonsAndVolumeBox } from "./components/ButtonsAndVolumeBox";
import { ButtonsBox } from "./components/ButtonsBox";
import { Loop } from "./components/Loop";
import { Previous } from "./components/Previous";
import { Play } from "./components/Play";
import { Pause } from "./components/Pause";
import { Next } from "./components/Next";
import { Shuffle } from "./components/Shuffle";
import { Volume } from "./components/Volume";
import { PlaylistTemplate } from "./components/PlaylistTemplate";
import { PlaylistItem } from "./components/PlaylistItem";

import loopCurrentBtn from "./icons/loop_current.png";
import loopNoneBtn from "./icons/loop_none.png";
import previousBtn from "./icons/previous.png";
import playBtn from "./icons/play.png";
import pauseBtn from "./icons/pause.png";
import nextBtn from "./icons/next.png";
import shuffleAllBtn from "./icons/shuffle_all.png";
import shuffleNoneBtn from "./icons/shuffle_none.png";

const fmtMSS = (s) => new Date(1000 * s).toISOString().substr(15, 4);

const urlParams = new URLSearchParams(document.location.search);
const player = urlParams.get('player');

async function getCover(){
  const res = await fetch(`https://bancomusical.com.br/music/${player}/tracklist.json`);  
  const data = await res.json()      
  console.log(data[0].cover[0].url)
  return data[0].cover[0].url
}
const cover = await getCover();

async function getTracklist(){
  const res = await fetch(`https://bancomusical.com.br/music/${player}/tracklist.json`);  
  const data = await res.json()    
  return data[1].music
}
const tracks = await getTracklist();

const Player = ({
  trackList = tracks,  
  includeSearch = true,
  showPlaylist = true,
  sortTracks = true,
  autoPlayNextTrack = true,
  customColorScheme = {},
}) => {
  const [audio, setAudio] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);
  const [title, setTitle] = useState("");
  const [length, setLength] = useState(0);
  const [time, setTime] = useState(0);
  const [slider, setSlider] = useState(1);
  const [buffer, setBuffer] = useState(0);
  const [drag, setDrag] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [shuffled, setShuffled] = useState(false);
  const [looped, setLooped] = useState(false);

  let playlist = [];
  const [filter, setFilter] = useState([]);
  let [curTrack, setCurTrack] = useState(0);
  const [query, updateQuery] = useState("");


  useEffect(() => {
    const audio = new Audio(trackList[curTrack].url);
    audio.load();

    const setAudioData = () => {
      setLength(audio.duration);
      setTime(audio.currentTime);
    };

    const setAudioTime = () => {
      const curTime = audio.currentTime;
      setTime(curTime);
      setSlider(curTime ? ((curTime * 100) / audio.duration).toFixed(1) : 0);
    };

    const setAudioProgress = () => {
      const bufferedPercentage = (audio.buffered.end(0) / audio.duration) * 100;
      setBuffer(bufferedPercentage.toFixed(2));
    };

    const setAudioVolume = () => setVolume(audio.volume);
    const setAudioEnd = () => setHasEnded(!hasEnded);

    audio.addEventListener("loadeddata", setAudioData);
    audio.addEventListener("timeupdate", setAudioTime);
    audio.addEventListener("progress", setAudioProgress);
    audio.addEventListener("volumechange", setAudioVolume);
    audio.addEventListener("ended", setAudioEnd);

    setAudio(audio);
    setTitle(trackList[curTrack].title);

    for (const [variable, value] of Object.entries(customColorScheme)) {
      document.documentElement.style.setProperty(`--${variable}`, value);
    }

    return () => {
      audio.removeEventListener("loadeddata", setAudioData);
      audio.removeEventListener("timeupdate", setAudioTime);
      audio.removeEventListener("progress", setAudioProgress);
      audio.removeEventListener("volumechange", setAudioVolume);
      audio.removeEventListener("ended", setAudioEnd);
      audio.pause();
      audio.src = "";
    };
  }, []);

  useEffect(() => {
    if (audio) {
      audio.src = trackList[curTrack].url;
      audio.load();

      audio.oncanplay = () => {
        setTitle(trackList[curTrack].title);
        play();
      };

      const setAudioEnd = () => {
        setHasEnded(!hasEnded);
      };
      audio.addEventListener("ended", setAudioEnd);

      return () => {
        audio.removeEventListener("ended", setAudioEnd);
      };
    }
  }, [curTrack]);

  useEffect(() => {
    if (audio) {
      if (shuffled) {
        playlist = shufflePlaylist(playlist);
      }
      if (looped) {
        play();
      } else if (autoPlayNextTrack && !looped) {
        next();
      } else {
        setIsPlaying(false);
      }
    }
  }, [hasEnded]);

  useEffect(() => {
    if (audio) {
      audio.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (audio) {
      pause();
      const val = Math.round((drag * audio.duration) / 100);
      const bufferedRanges = audio.buffered;

      let isInBufferedRange = false;
      for (let i = 0; i < bufferedRanges.length; i++) {
        if (val >= bufferedRanges.start(i) && val <= bufferedRanges.end(i)) {
          isInBufferedRange = true;
          break;
        }
      }

      if (isInBufferedRange) {
        audio.currentTime = val;
      } else {
        const waitingHandler = () => {
          if (audio.readyState === 4) {
            audio.removeEventListener("waiting", waitingHandler);
            // console.log("waiting for data");
          }
        };
        audio.addEventListener("waiting", waitingHandler);
      }
    }
  }, [drag]);

  useEffect(() => {
    if (audio) {
      let setAudioEnd;

      if (looped) {
        setAudioEnd = () => {
          audio.currentTime = 0;
          play();
        };
      } else {
        setAudioEnd = () => {
          setHasEnded(!hasEnded);
        };
      }

      audio.addEventListener("ended", setAudioEnd);

      return () => {
        audio.removeEventListener("ended", setAudioEnd);
      };
    }
  }, [looped]);

  useEffect(() => {
    if (!playlist.includes(curTrack)) {
      setCurTrack((curTrack = playlist[0]));
    }
  }, [filter]);

  //  Handle functions

  const loop = () => {
    setLooped(!looped);
  };

  const previous = () => {
    const index = playlist.indexOf(curTrack);
    index !== 0
      ? setCurTrack((curTrack = playlist[index - 1]))
      : setCurTrack((curTrack = playlist[playlist.length - 1]));
  };

  const play = () => {
    setIsPlaying(true);
    audio.play();
  };

  const pause = () => {
    setIsPlaying(false);
    audio.pause();
  };

  const next = () => {
    const index = playlist.indexOf(curTrack);
    index !== playlist.length - 1
      ? setCurTrack((curTrack = playlist[index + 1]))
      : setCurTrack((curTrack = playlist[0]));
  };

  const shuffle = () => {
    setShuffled(!shuffled);
  };

  const shufflePlaylist = (arr) => {
    if (arr.length === 1) return arr;
    const rand = Math.floor(Math.random() * arr.length);
    return [arr[rand], ...shufflePlaylist(arr.filter((_, i) => i !== rand))];
  };

  const sortCompare = (a, b) =>
    !sortTracks ? null : a.url.toLowerCase() > b.url.toLowerCase() ? 1 : -1;


  const playlistItemClickHandler = (e) => {
    const num = Number(e.currentTarget.getAttribute("data-key"));
    const index = playlist.indexOf(num);
    setCurTrack((curTrack = playlist[index]));
    play();
  };

  return (
    <div className="wrapper">
    <PageTemplate>
      {includeSearch && (
        <Search
          value={query}
          onChange={(e) => updateQuery(e.target.value.toLowerCase())}
          placeholder={`Pesquise entre as ${trackList.length} músicas dessa playlist ...`}
        />
      )}
      
        <div className="playerTemplate">
        <Cover src={cover} />
        <div className="playerControls">
            <TitleAndTimeBox>
              <Title title={title} />
              <Time
                time={`${!time ? "0:00" : fmtMSS(time)}/${
                  !length ? "0:00" : fmtMSS(length)
                }`}
              />
            </TitleAndTimeBox>
            <Progress
              value={slider}
              progress={buffer}
              onChange={(e) => {
                setSlider(e.target.value);
                setDrag(e.target.value);
              }}
              onMouseUp={play}
              onTouchEnd={play}
            />
            <ButtonsAndVolumeBox>
              <ButtonsBox>
                
                <Previous src={previousBtn} onClick={previous} />
                {isPlaying ? (
                  <Pause src={pauseBtn} onClick={pause} />
                ) : (
                  <Play src={playBtn} onClick={play} />
                )}
                <Next src={nextBtn} onClick={next} />
                <Shuffle
                  src={shuffled ? shuffleAllBtn : shuffleNoneBtn}
                  onClick={shuffle}
                />
              </ButtonsBox>
              <Volume
                value={volume}
                onChange={(e) => {
                  setVolume(e.target.value / 100);
                }}
              />
            </ButtonsAndVolumeBox>
        </div>        
        </div>
        
      
      <PlaylistTemplate visibility={showPlaylist}>
        {trackList.sort(sortCompare).map((el, index) => {
          if (filter.length === 0) {
            if (el.title.toLowerCase().includes(query.toLowerCase())) {
              playlist.push(index);
              return (
                <PlaylistItem
                  status={curTrack === index ? "active" : ""}
                  key={index}
                  data_key={index}
                  title={el.title}
                  src={el.url}
                  onClick={playlistItemClickHandler}
                />
              );
            }
          }
        })}
      </PlaylistTemplate>
    </PageTemplate>
    </div>
  );
};

export default Player;