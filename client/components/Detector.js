import * as poseDetection from "@tensorflow-models/pose-detection";
import "@tensorflow/tfjs-backend-webgl";
import React, { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import { IconButton, SvgIcon, makeStyles } from "@material-ui/core";
import PlayArrowIcon from "@material-ui/icons/PlayArrow";
import StartButton from "./StartButton";
import evaluateExercise from "./Evaluator";
import Scoreboard from "./Scoreboard";

const useStyles = makeStyles((theme) => ({
  roundButton: {
    backgroundColor: "#FFC2B4",
    border: "2px solid #156064",
    opacity: "0.5",
  },
}));

const squatCriteria = [
  // name : [score req, min angle, max angle]
  { right_hipright_knee: [0.5, null, 5, "require"] },
  { right_shoulderright_hip: [0.5, null, 70, "avoid"] },
  { left_shoulderright_shoulder: [0.65, 10, null, "avoid"] },
];

const Detector = () => {
  const classes = useStyles();
  const [score, setScore] = useState({});
  const [angleArray, setAngleArray] = useState([]);

  // const [status, setStatus] = useState("counted");

  const webcamRef = useRef();
  const canvasRef = useRef();

  let time, maxTime;
  let noseHeight = 0;
  let status = "counted";
  let reps = 0;
  let [finished, setFinished] = useState(false);
  let [ticker, setTicker] = useState();

  async function init() {
    const detectorConfig = {
      modelType: poseDetection.movenet.modelType.SINGLEPOSE_THUNDER,
    };
    const detector = await poseDetection.createDetector(
      poseDetection.SupportedModels.MoveNet,
      detectorConfig
    );
    if (detector) {
      requestAnimationFrame(async () => {
        await getPoses(detector);
      });
    }
  }

  async function getPoses(detector) {
    if (
      typeof webcamRef.current !== "undefined" &&
      webcamRef.current !== null &&
      webcamRef.current.video.readyState === 4
    ) {
      // Get video properties
      const video = webcamRef.current.video;
      const videoWidth = webcamRef.current.video.videoWidth;
      const videoHeight = webcamRef.current.video.videoHeight;

      // Set video properties
      webcamRef.current.video.width = videoWidth;
      webcamRef.current.video.height = videoHeight;

      if (detector) {
        let poses = await detector.estimatePoses(video);
        // console.log("poses", poses);
        if (time === maxTime) {
          // poses[0].keypoints[0].y refers to the y coordinate of the nose keypoint
          console.log("first pose", poses);
          noseHeight = poses[0].keypoints[0].y;
          console.log("noseHeight", noseHeight);
        }

        if (
          status === "counted" &&
          poses[0].keypoints[0].y > noseHeight + 100
        ) {
          status = "bottom";
          console.log("status", status);
        }

        if (status === "bottom" && poses[0].keypoints[0].y < noseHeight + 100) {
          status = "rising";
          console.log("status", status);
        }

        if (status === "rising" && poses[0].keypoints[0].y < noseHeight + 30) {
          status = "counted";
          console.log("status", status);
          reps++;
          console.log("reps", reps);
        }

        if (time > 0) {
          time--;
          setTicker(time);
          requestAnimationFrame(async () => {
            await getPoses(detector);
          });
          drawCanvas(poses, videoWidth, videoHeight, canvasRef);
        }
        if (time === 0) {
          const ctx = canvasRef.current.getContext("2d");
          ctx.clearRect(
            0,
            0,
            canvasRef.current.width,
            canvasRef.current.height
          );
          const result = await evaluateExercise(angleArray, squatCriteria);
          setScore(result);
          setFinished(true);
        }
      }
    }
  }

  function handleClick() {
    setTicker("LOADING");
    setFinished(false);
    setScore({});
    time = 40;
    maxTime = time;
    setAngleArray([]);
    init();
  }

  function drawKeypoint(keypoint) {
    const ctx = canvasRef.current.getContext("2d");
    // If score is null, just show the keypoint.
    const confidence = keypoint.score != null ? keypoint.score : 1;
    const scoreThreshold = 0.3 || 0;

    if (confidence >= scoreThreshold) {
      const circle = new Path2D();
      circle.arc(keypoint.x, keypoint.y, 4, 0, 2 * Math.PI);
      ctx.fill(circle);
      ctx.stroke(circle);
    }
  }

  function drawKeypoints(keypoints) {
    const ctx = canvasRef.current.getContext("2d");
    const keypointInd = poseDetection.util.getKeypointIndexBySide("MoveNet");
    ctx.fillStyle = "White";
    ctx.strokeStyle = "White";
    ctx.lineWidth = 2;

    //middle points will be white (just nose)
    for (const i of keypointInd.middle) {
      drawKeypoint(keypoints[i]);
    }
    //left points will be green... note your actual left side (technically right side when looking at video)
    ctx.fillStyle = "Green";
    for (const i of keypointInd.left) {
      drawKeypoint(keypoints[i]);
    }
    //right points will be orange... note your actual right side (technically left side when looking at video)
    ctx.fillStyle = "Orange";
    for (const i of keypointInd.right) {
      drawKeypoint(keypoints[i]);
    }
  }

  function drawSkeleton(keypoints) {
    const ctx = canvasRef.current.getContext("2d");
    ctx.fillStyle = "White";
    ctx.strokeStyle = "White";
    ctx.lineWidth = 2;

    poseDetection.util.getAdjacentPairs("MoveNet").forEach(([i, j]) => {
      const kp1 = keypoints[i];
      const kp2 = keypoints[j];
      const firstX = kp1.x;
      const firstY = kp1.y;
      const secondX = kp2.x;
      const secondY = kp2.y;
      const name = kp1.name + kp2.name;
      const adjacentPairAngle = Math.abs(
        (Math.atan((firstY - secondY) / (firstX - secondX)) * 180) / Math.PI
      );

      if (kp1.score > 0.5 && kp2.score > 0.5) {
        angleArray.push({ [name]: [adjacentPairAngle, kp1.score, kp2.score] });
      }

      // If score is null, just show the keypoint.
      const score1 = kp1.score != null ? kp1.score : 1;
      const score2 = kp2.score != null ? kp2.score : 1;
      const scoreThreshold = 0.2;

      if (score1 >= scoreThreshold && score2 >= scoreThreshold) {
        ctx.beginPath();
        ctx.moveTo(kp1.x, kp1.y);
        ctx.lineTo(kp2.x, kp2.y);
        ctx.stroke();
      }
    });
  }

  function drawCanvas(poses, videoWidth, videoHeight, canvas) {
    canvas.current.width = videoWidth;
    canvas.current.height = videoHeight;

    drawKeypoints(poses[0].keypoints);
    drawSkeleton(poses[0].keypoints);
  }

  return (
    <div>
      <div>
        <div>
          <Webcam
            id="webcam"
            ref={webcamRef}
            style={{
              transform: "scaleX(-1)",
              filter: "FlipH",
              position: "fixed",
              height: "100%",
              width: "100%",
              objectFit: "cover",
            }}
          />
          <canvas
            id="canvas"
            ref={canvasRef}
            style={{
              transform: "scaleX(-1)",
              filter: "FlipH",
              position: "fixed",
              height: "100%",
              width: "100%",
              objectFit: "cover",
            }}
          />
        </div>
        {/* <div
          style={{
            position: "fixed",
            top: "3%",
            left: "80%",
            zIndex: 10,
            objectFit: "cover",
          }}
        >
          Timer:
        </div> */}
        {finished ? (
          <Scoreboard openStatus={true} scoreProp={score} />
        ) : (
          <div></div>
        )}
        <div
          id="ticker"
          style={{
            position: "fixed",
            left: "50%",
            top: "50%",
            zIndex: 10,
            objectFit: "cover",
            backgroundColor: "white",
            opacity: "0.5",
          }}
        >
          {ticker}
        </div>
      </div>
      <IconButton
        className={classes.roundButton}
        id="start"
        type="button"
        style={{
          cursor: "pointer",
          position: "fixed",
          zIndex: 10,
          objectFit: "cover",
          height: "80px",
          width: "80px",
          top: "85%",
          left: "calc(50% - 40px)",
          padding: "0px",
        }}
        onClick={() => handleClick()}
      >
        <StartButton />
      </IconButton>
    </div>
  );
};

export default Detector;
