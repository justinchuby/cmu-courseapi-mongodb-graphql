/* eslint-disable no-console */
import { GraphQLScalarType } from 'graphql'
// import { Kind } from 'graphql/language'
import { Course, Meeting } from './models'
import {
  buildMongoConditionsFromFilters,
  FILTER_CONDITION_TYPE
} from '@entria/graphql-mongo-helpers'

// promisify found on https://g00glen00b.be/graphql-nodejs-express-apollo/
// const promisify = query =>
//   new Promise((resolve, reject) => {
//     query.exec((err, data) => {
//       if (err) reject(err)
//       else resolve(data)
//     })
//   })

const dateScalarType = new GraphQLScalarType({
  // https://www.apollographql.com/docs/graphql-tools/scalars.html#Date-as-a-scalar
  name: 'Date',
  description: 'The Javascript native Date type.',
  parseValue(value) {
    return new Date(value) // value from the client
  },
  serialize(value) {
    return value.toJSON() // value sent to the client
  },
  parseLiteral(ast) {
    // TODO: Add varification
    return new Date(ast.value)
  }
})

const courseFilterMapping = {
  text: {
    type: FILTER_CONDITION_TYPE.CUSTOM_CONDITION,
    format: val => {
      return { $text: { $search: val } }
    }
  },
  courseId: {
    type: FILTER_CONDITION_TYPE.MATCH_1_TO_1,
    format: val => new RegExp(val)
  },
  coreq: {
    type: FILTER_CONDITION_TYPE.CUSTOM_CONDITION,
    format: val => {
      return {
        'coreqsObj.reqs': { $elemMatch: { $elemMatch: { $in: [val] } } }
      }
    }
  },
  prereq: {
    type: FILTER_CONDITION_TYPE.CUSTOM_CONDITION,
    format: val => {
      return {
        'prereqsObj.reqs': { $elemMatch: { $elemMatch: { $in: [val] } } }
      }
    }
  }
}

const meetingFilterMapping = {
  instructor: {
    type: FILTER_CONDITION_TYPE.CUSTOM_CONDITION,
    format: val => {
      const names = val.split(' ')
      const regex = names.map((e) => new RegExp(e, 'i'))
      return {
        $and: [
          { $text: { $search: val } },
          { 'instructor': { $in: { regex }}}
        ]
      }
    }
  },
  courseId: {
    type: FILTER_CONDITION_TYPE.MATCH_1_TO_1,
    format: val => new RegExp(val)
  },
  day: {
    type: FILTER_CONDITION_TYPE.MATCH_1_TO_1,
    format: val => {
      return { $in: { val } }
    }
  }
}

// A map of functions which return data for the schema.
export const resolvers = {
  Date: dateScalarType,
  Course: {
    meetings: ({ courseId, semester, year }) => {
      return Meeting.find({ courseId, semester, year }).exec()
    }
  },
  Meeting: {
    course: ({ courseId, semester, year }) => {
      return Course.findOne({ courseId, semester, year }).exec()
    }
  },
  Query: {
    course: (root, args) => {
      const { courseId, semester, year } = args
      return Course.findOne({ courseId, semester, year }).exec()
    },
    courses: (root, args) => {
      const { filter, offset, limit } = args
      const filterResult = buildMongoConditionsFromFilters(
        filter,
        courseFilterMapping
      )
      const query = Course.find(filterResult.conditions)
      if (offset) {
        query.skip(offset)
      }
      if (limit) {
        query.limit(offset)
      }
      return query.exec()
    },
    meetings: (root, args) => {
      const { filter, offset, limit } = args
      const filterResult = buildMongoConditionsFromFilters(
        filter,
        meetingFilterMapping
      )
      const query = Meeting.find(filterResult.conditions)
      if (offset) {
        query.skip(offset)
      }
      if (limit) {
        query.limit(offset)
      }
      return query.exec()
    }
  }
}

// https://blog.apollographql.com/batching-client-graphql-queries-a685f5bcd41b
// $and:[{
//   $text: {
//     $search: "Moss Carrie-Anne"
// }},{
// cast: {
//     $elemMatch: {$regex: /Moss/, $regex: /Carrie-Anne/}}
// }]}
// );

// {"prereqsObj.reqs": {$elemMatch:{$elemMatch:{$in: ["15-112"]}}}}
