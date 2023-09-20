import React from "react";
import { useRouter } from "next/router";
import { Paper, Box, Typography, IconButton } from "@mui/material";
import { ThumbUp, ThumbDown } from "@mui/icons-material";
import { useTheme } from "@emotion/react";
import { useState } from "react";
import { ContentCopy as ContentCopyIcon } from "@mui/icons-material";
import DownloadIcon from "@mui/icons-material/Download";
import clipboardCopy from "clipboard-copy";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Button,
} from "@mui/material";
import { sdk } from "../../../lib/apiClient";
import MarkdownBlock from "../../data/MarkdownBlock";
const WAIT_MESSAGE = "Let me think about that for a moment. Please wait..";

export default function ConversationHistory({ chatHistory, isLoading, theme }) {
  const router = useRouter();
  const agentName = router.query.agent;

  let lastUserMessage = ""; // track the last user message

  return (
    <Paper
      elevation={5}
      sx={{
        overflowY: "auto",
        display: "flex",
        flexDirection: "column-reverse",
        height: "65vh",
      }}
    >
      <div style={{ width: "100%" }}>
        {chatHistory
          ? chatHistory.map((chatItem, index) => {
              if (chatItem.role === "USER") {
                lastUserMessage = chatItem.message;
              }
              return (
                <ChatMessage
                  key={index}
                  chatItem={chatItem}
                  lastUserMessage={lastUserMessage} // Pass the last user message as a prop
                />
              );
            })
          : null}
        {isLoading && (
          <ChatMessage
            key={"Please Wait"}
            chatItem={{
              role: agentName,
              message: WAIT_MESSAGE,
              timestamp: "Just Now...",
            }}
            isLoading={isLoading}
          />
        )}
      </div>
    </Paper>
  );
}

const ChatMessage = ({ chatItem, lastUserMessage, isLoading }) => {
  const formattedMessage =
    typeof chatItem.message === "string"
      ? chatItem.message.replace(/\\n/g, "  \n").replace(/\n/g, "  \n")
      : chatItem.message;
  const theme = useTheme();
  const [vote, setVote] = useState(0);
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState("");

  const handleClickOpen = (newVote) => {
    setVote(newVote);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleCopyClick = () => {
    clipboardCopy(formattedMessage);
  };
  const handleDownloadClick = () => {
    const element = document.createElement("a");
    const file = new Blob([formattedMessage], {
      type: "text/plain;charset=utf-8",
    });
    element.href = URL.createObjectURL(file);
    element.download = `${chatItem.role}-${chatItem.timestamp}.txt`;
    document.body.appendChild(element);
    element.click();
  };
  const langMap = {
    "": "txt",
    python: "py",
    javascript: "js",
    typescript: "ts",
    html: "html",
    css: "css",
    json: "json",
    yaml: "yaml",
    markdown: "md",
    shell: "sh",
    bash: "sh",
    sql: "sql",
    java: "java",
    c: "c",
    cpp: "cpp",
    csharp: "cs",
    go: "go",
    rust: "rs",
    php: "php",
    ruby: "rb",
    perl: "pl",
    lua: "lua",
    r: "r",
    swift: "swift",
    kotlin: "kt",
    scala: "scala",
    clojure: "clj",
    elixir: "ex",
    erlang: "erl",
    haskell: "hs",
    ocaml: "ml",
    pascal: "pas",
    scheme: "scm",
    coffeescript: "coffee",
    fortran: "f",
    julia: "jl",
    lisp: "lisp",
    prolog: "pro",
    vbnet: "vb",
    dart: "dart",
    fsharp: "fs",
    groovy: "groovy",
    perl6: "pl",
    powershell: "ps1",
    puppet: "pp",
    qml: "qml",
    racket: "rkt",
    sas: "sas",
    verilog: "v",
    vhdl: "vhd",
    apex: "cls",
    matlab: "m",
    nim: "nim",
    ocaml: "ml",
    pascal: "pas",
    scheme: "scm",
    coffeescript: "coffee",
  };

  const renderMessage = () => {
    const message = formattedMessage.toString();
    const match = message.match(/#(.*?)(?=\n|$)/);
    if (match) {
      if (message.includes("GENERATED_IMAGE:")) {
        const base64Image = match[1].replace("GENERATED_IMAGE:", "").trim();
        const formattedImage = base64Image.toString("base64");
        return message.replace(
          match[0],
          `![Generated Image](data:image/png;base64,${formattedImage})`
        );
      }
      if (message.includes("GENERATED_AUDIO:")) {
        const base64Audio = match[1].replace("GENERATED_AUDIO:", "").trim();
        const formattedAudio = base64Audio.toString("base64");
        return message.replace(
          match[0],
          `![Generated Audio](data:audio/wav;base64,${formattedAudio})`
        );
      }
    }
    return formattedMessage;
  };

  return (
    <Box
      sx={{
        p: "1rem",
        backgroundColor:
          chatItem.role === "USER"
            ? theme.palette.background.default
            : theme.palette.action.selected,
      }}
    >
      <Box
        sx={{
          maxWidth: "80%",
          padding: "10px",
          marginBottom: "5px",
          overflow: "hidden",
          position: "center",
        }}
      >
        <MarkdownBlock
          content={chatItem.message}
          chatItem={chatItem}
          theme={theme}
        />
        <Typography
          variant="caption"
          style={{
            color: theme.palette.text.secondary,
            width: "100%",
            display: "inline-block",
          }}
        >
          {chatItem.role === "USER" ? "You" : chatItem.role} •{" "}
          {chatItem.timestamp}
        </Typography>
        {chatItem.role != "USER" && !isLoading && (
          <>
            <IconButton onClick={() => handleClickOpen(1)}>
              <ThumbUp color={vote === 1 ? "success" : "inherit"} />
            </IconButton>
            <IconButton onClick={() => handleClickOpen(-1)}>
              <ThumbDown color={vote === -1 ? "error" : "inherit"} />
            </IconButton>

            <IconButton onClick={handleCopyClick}>
              <ContentCopyIcon />
            </IconButton>
            <IconButton onClick={handleDownloadClick}>
              <DownloadIcon />
            </IconButton>
          </>
        )}
        <Dialog
          open={open}
          onClose={handleClose}
          aria-labelledby="form-dialog-title"
        >
          <DialogTitle id="form-dialog-title">Provide Feedback</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Please provide some feedback regarding the message.
            </DialogContentText>
            <TextField
              autoFocus
              margin="dense"
              id="name"
              label="Feedback"
              type="text"
              fullWidth
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              color="info"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose} color="error">
              Cancel
            </Button>
            <Button
              onClick={() => {
                const messageText = `User Feedback: ${feedback} \n\n Message: ${chatItem.message} \n\n Last User Message: ${lastUserMessage}`;
                handleClose();
                if (vote === 1) {
                  sdk.learnText(chatItem.role, lastUserMessage, messageText, 2);
                } else {
                  sdk.learnText(chatItem.role, lastUserMessage, messageText, 3);
                }
              }}
              color="info"
            >
              Submit
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};
