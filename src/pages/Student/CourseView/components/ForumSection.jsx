import React from 'react'
import ForumTopics from '../../../../components/forum/ForumTopics'
import TopicDetail from '../../../../components/forum/TopicDetail'

const ForumSection = ({ courseId, selectedTopic, setSelectedTopic, isMobile = false }) => {
  return (
    <div className={`${isMobile ? '' : 'bg-white dark:bg-gray-800 rounded-xl shadow-sm'}`}>
      {!isMobile && (
        <div className="p-5 border-b">
          <h2 className="text-xl font-bold">💬 Discussion Forum</h2>
          <p className="text-sm text-gray-500">Ask questions and discuss with fellow students</p>
        </div>
      )}
      <div className={!isMobile ? 'p-5' : ''}>
        {selectedTopic ? (
          <TopicDetail topicId={selectedTopic} courseId={courseId} onBack={() => setSelectedTopic(null)} />
        ) : (
          <ForumTopics courseId={courseId} onSelectTopic={setSelectedTopic} />
        )}
      </div>
    </div>
  )
}

export default ForumSection