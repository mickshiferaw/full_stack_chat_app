import { useContext, useEffect, useRef, useState } from "react";
import Avatar from "./Avatar";
import Logo from "./Logo";
import { UserContext } from "./UserContext";
import { uniqBy } from "lodash";
import axios from "axios";
import Contact from "./Contact";
export default function Chat() {
  const [ws, setWs] = useState(null);
  const [onlinePeople, setOnlinePeople] = useState({});
  const [offLinePeople, setOfflinePeople] = useState({});
  const [selectedUserId, setSelectedUserId] = useState(null);
  const { username, id } = useContext(UserContext);
  const [newMessageText, setNewMessageText] = useState("");
  const [messages, setMessages] = useState([]);
  const divUnderMessages = useRef();
  useEffect(() => {
    connectToWebSocket();
  }, []);

  function connectToWebSocket() {
    const ws = new WebSocket("ws://localhost:4000");
    setWs(ws);
    ws.addEventListener("message", handleMessage);
    ws.addEventListener("close", () => connectToWebSocket());
  }

  function showOnlinePeople(peopleArray) {
    const people = {};
    peopleArray.forEach(({ userId, username }) => {
      people[userId] = username;
    });

    setOnlinePeople(people);
  }
  function handleMessage(ev) {
    const messageData = JSON.parse(ev.data);
    if ("online" in messageData) {
      showOnlinePeople(messageData.online);
    } else if ("text" in messageData) {
      setMessages((prev) => [...prev, { ...messageData }]);
    }
  }

  function sendMessage(ev) {
    ev.preventDefault();
    ws.send(
      JSON.stringify({
        recipient: selectedUserId,
        text: newMessageText,
      })
    );
    setNewMessageText("");
    setMessages((prev) => [
      ...prev,
      {
        text: newMessageText,
        sender: id,
        recipient: selectedUserId,
        _id: Date.now(),
      },
    ]);
  }

  useEffect(() => {
    const div = divUnderMessages.current;
    if (div) {
      div.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages]);

  useEffect(() => {
    axios.get("/people").then((res) => {
      const offLinePeopleArr = res.data
        .filter((p) => p._id !== id)
        .filter((p) => !Object.keys(onlinePeople).includes(p._id));
      const offlinePeople = {};
      offLinePeopleArr.forEach((p) => {
        offlinePeople[p._id] = p;
      });
      setOfflinePeople(offlinePeople);
    });
  }, [onlinePeople]);

  useEffect(() => {
    if (selectedUserId) {
      axios.get("/messages/" + selectedUserId).then((res) => {
        setMessages(res.data);
      });
    }
  }, [selectedUserId]);

  const onlinePeopleExclOurUsr = { ...onlinePeople };
  delete onlinePeopleExclOurUsr[id];
  const messagesWithoutDups = uniqBy(messages, "_id");
  return (
    <div className="flex h-screen">
      <div className="bg-white w-1/3 ">
        <Logo />

        {Object.keys(onlinePeopleExclOurUsr).map((userId) => (
          <Contact
            key={userId}
            id={userId}
            online={true}
            username={onlinePeopleExclOurUsr[userId]}
            onClick={() => setSelectedUserId(userId)}
            selected={userId === selectedUserId}
            onlinee={onlinePeople[id]}
          />
        ))}
        {Object.keys(offLinePeople).map((userId) => (
          <Contact
            key={userId}
            id={userId}
            online={false}
            username={offLinePeople[userId].username}
            onClick={() => setSelectedUserId(userId)}
            selected={userId === selectedUserId}
            onlinee={onlinePeople[id]}
          />
        ))}
      </div>
      <div className="bg-blue-50 w-2/3 p-2 flex flex-col ">
        <div className="flex-grow">
          {!selectedUserId && (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-300">
                {" "}
                &larr; Select a person from the side bar
              </div>
            </div>
          )}
          {!!selectedUserId && (
            <div className="relative h-full ">
              <div className="overflow-y-scroll absolute top-0 left-0 right-0 bottom-2">
                {messagesWithoutDups.map((message) => (
                  <div
                    key={message._id}
                    className={
                      message.sender === id ? "text-right" : "text-left"
                    }
                  >
                    <div
                      className={
                        " text-left inline-block p-2 my-2 rounded-md text-sm " +
                        (message.sender === id
                          ? "bg-blue-500 text-white"
                          : "bg-white text-gray-500")
                      }
                    >
                      {message.text}
                    </div>
                  </div>
                ))}
                <div ref={divUnderMessages}> </div>
              </div>
            </div>
          )}
        </div>
        {!!selectedUserId && (
          <form className="flex gap-2 " onSubmit={sendMessage}>
            <input
              type="text"
              value={newMessageText}
              onChange={(ev) => setNewMessageText(ev.target.value)}
              placeholder="type your message here  "
              className="bg-white border p-2 flex-grow rounded-sm "
            />
            <button
              type="submit"
              className="bg-blue-500 p-2 text-white rounded-sm "
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                />
              </svg>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
