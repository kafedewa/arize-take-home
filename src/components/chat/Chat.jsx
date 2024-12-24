import React from 'react'
import MessageContainer from '../../components/messages/MessageContainer'

const Chat = () => {

  return (
    <div className="flex flex-col h-full w-screen">
      <div className="navbar flex fixed bg-white h-16 top-0 left-0 right-0">
        <h1 className="text-3xl font-semibold text-black flex-1 top-0 justify-center">American Relief Act Agent</h1>
      </div>

          <div className="flex flex-col">
            <div className="flex-1 rounded-lg">
              <MessageContainer />
            </div>
          </div>

    </div>)
}

export default Chat