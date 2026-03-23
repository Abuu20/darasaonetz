import { supabase } from '../client'

export const forumQueries = {
    // Get topics for a course
    getTopics: async (courseId, page = 0, limit = 20) => {
        const { data, error } = await supabase
            .from('forum_topics')
            .select(`
                *,
                profiles:user_id (
                    id,
                    full_name,
                    avatar_url,
                    role
                ),
                replies:forum_replies (count)
            `)
            .eq('course_id', courseId)
            .order('is_pinned', { ascending: false })
            .order('created_at', { ascending: false })
            .range(page * limit, (page + 1) * limit - 1)

        if (error) throw error
        return data
    },

    // Get single topic with replies
    getTopic: async (topicId) => {
        // Increment views
        await supabase.rpc('increment_topic_views', { topic_id: topicId })
        
        const { data, error } = await supabase
            .from('forum_topics')
            .select(`
                *,
                profiles:user_id (
                    id,
                    full_name,
                    avatar_url,
                    role
                ),
                replies:forum_replies (
                    *,
                    profiles:user_id (
                        id,
                        full_name,
                        avatar_url,
                        role
                    ),
                    likes:forum_likes (count),
                    user_liked:forum_likes!inner (
                        id
                    )
                )
            `)
            .eq('id', topicId)
            .single()

        if (error) throw error
        return data
    },

    // Create new topic
    createTopic: async (courseId, userId, title, content) => {
        const { data, error } = await supabase
            .from('forum_topics')
            .insert({
                course_id: courseId,
                user_id: userId,
                title,
                content
            })
            .select()
            .single()

        if (error) throw error
        return data
    },

    // Create reply
    createReply: async (topicId, userId, content) => {
        const { data, error } = await supabase
            .from('forum_replies')
            .insert({
                topic_id: topicId,
                user_id: userId,
                content
            })
            .select()
            .single()

        if (error) throw error

        // Update reply count on topic
        await supabase.rpc('increment_reply_count', { topic_id: topicId })
        
        return data
    },

    // Mark as best answer
    markBestAnswer: async (replyId, topicId) => {
        const { error } = await supabase
            .from('forum_replies')
            .update({ is_best_answer: true })
            .eq('id', replyId)

        if (error) throw error

        // Mark topic as solved
        await supabase
            .from('forum_topics')
            .update({ is_solved: true })
            .eq('id', topicId)

        return true
    },

    // Like/unlike reply
    toggleLike: async (replyId, userId) => {
        const { data: existing } = await supabase
            .from('forum_likes')
            .select('id')
            .eq('reply_id', replyId)
            .eq('user_id', userId)
            .maybeSingle()

        if (existing) {
            // Unlike
            await supabase
                .from('forum_likes')
                .delete()
                .eq('id', existing.id)
            
            await supabase.rpc('decrement_like_count', { reply_id: replyId })
            return { liked: false }
        } else {
            // Like
            await supabase
                .from('forum_likes')
                .insert({
                    reply_id: replyId,
                    user_id: userId
                })
            
            await supabase.rpc('increment_like_count', { reply_id: replyId })
            return { liked: true }
        }
    },

    // Delete topic
    deleteTopic: async (topicId) => {
        const { error } = await supabase
            .from('forum_topics')
            .delete()
            .eq('id', topicId)

        if (error) throw error
        return true
    },

    // Delete reply
    deleteReply: async (replyId) => {
        const { error } = await supabase
            .from('forum_replies')
            .delete()
            .eq('id', replyId)

        if (error) throw error
        return true
    }
}
