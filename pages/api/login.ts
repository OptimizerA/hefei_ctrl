// import type { NextApiRequest, NextApiResponse } from 'next';
// import pool from '../../lib/db'; // 假设你把连接池的代码放在 lib/db.ts 中
// import jwt from 'jsonwebtoken';
// import { RowDataPacket } from 'mysql2';

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   console.log('Received request method:', req.method);
  
//   if (req.method !== 'POST') {
//     return res.status(405).json({ message: 'Method Not Allowed' });
//   }

//   try {
//     const connection = await pool.getConnection();
//     const { username, password } = req.body;

//     try {
//       const [rows] = await connection.execute<RowDataPacket[]>(
//         'SELECT * FROM user WHERE UserName = ? AND Password = ?', [username, password]
//       );

//       if (rows.length > 0) {
//         const user = rows[0];
//         const experimentGroup = user.ExperimentGroup;
//         const modifiedPassword = user.Password;
//         const userProfile = user.Profile;
//         const usercontentID = user.CourseID || 0;
//         const searchValue = experimentGroup["2024Spring_Socratic"];
//         const gptValue = experimentGroup["2024Spring_Gamified"];
//         const versionValue = experimentGroup["2024Spring_SocraticVersion"] || 0;

//         const [promptRows] = await pool.execute<RowDataPacket[]>(
//           'SELECT Prompts FROM prompt WHERE PromptID = ?', [versionValue + 1]
//         );
//         const userprompt = promptRows.length > 0 ? promptRows[0].Prompts : null;

//         const [authRows] = await pool.execute<RowDataPacket[]>(
//           'SELECT Auth_Code FROM GptAuth WHERE Auth_ID = 1'
//         );
//         const authValue = authRows.length > 0 ? authRows[0].Auth_Code : null;

//         const [courseRows] = await pool.execute<RowDataPacket[]>(
//           'SELECT CourseContent FROM course WHERE CourseID = ?', [usercontentID]
//         );
//         const courseprofile = courseRows.length > 0 ? courseRows[0].CourseContent : null;

//         let CID = '';
//         let redirectUrl = '';
//         if (versionValue !== 1) {
//           if (versionValue === 2) {
//             redirectUrl = 'url associated with v2 gpt';
//           } else if (versionValue === 3) {
//             redirectUrl = 'url associated with v3 gpt';
//           } else if (versionValue === 4) {
//             redirectUrl = 'url associated with v3 gpt';
//           } else {
//             redirectUrl = 'url associated with v3 gpt ';
//           }
//         } else {
//           redirectUrl = "url associated with v1 gpt";
//         }

//         const secretKey = process.env.JWT_SECRET_KEY as string;
//         const token = jwt.sign(
//           {
//             username: user.UserName,
//             password: modifiedPassword,
//             experimentGroup: experimentGroup,
//             gptAuth: authValue,
//             profile: userProfile,
//             prompt: userprompt,
//             course: courseprofile
//           },
//           secretKey,
//           { expiresIn: '24h' }
//         );

//         res.status(200).json({ success: true, token, redirect: redirectUrl, CID: CID });
//       } else {
//         res.status(401).json({ success: false, message: 'Authentication failed' });
//       }
//     } finally {
//       connection.release(); // 确保连接在使用后被释放回连接s
//     }
//   } catch (error) {
//     console.error('Database connection or query failed:', error);
//     res.status(500).json({ success: false, message: 'Internal server error' });
//   }
// }



import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '../../lib/db';
import jwt from 'jsonwebtoken';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('Received request method:', req.method);

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { username, password } = req.body;

    // 查询用户信息
    let userResult;
    try {
      userResult = await pool.query(
        'SELECT * FROM "user" WHERE "UserName" = $1 AND "Password" = $2',
        [username, password]
      );
      console.log('User query result:', userResult.rows);
    } catch (error) {
      console.error('User query failed:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }

    if (userResult.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Authentication failed' });
    }

    const user = userResult.rows[0];
    const experimentGroup = JSON.parse(user.ExperimentGroup);
    const modifiedPassword = user.Password;
    const userProfile = user.Profile;
    const usercontentID = user.CourseID || 0;
    const searchValue = experimentGroup["2024Spring_Socratic"];
    const gptValue = experimentGroup["2024Spring_Gamified"];
    const versionValue = experimentGroup["2024Spring_SocraticVersion"] || 0;

    // 查询 prompt
    let promptResult;
    try {
      promptResult = await pool.query(
        'SELECT "Prompts" FROM prompt WHERE "PromptID" = $1',
        [versionValue + 1]
      );
      console.log('Prompt query result:', promptResult.rows);
    } catch (error) {
      console.error('Prompt query failed:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
    const userprompt = promptResult.rows.length > 0 ? promptResult.rows[0].Prompts : null;

    // 查询 GptAuth
    let authResult;
    try {
      authResult = await pool.query(
        'SELECT "Auth_Code" FROM GptAuth WHERE "Auth_ID" = 1'
      );
      console.log('GptAuth query result:', authResult.rows);
    } catch (error) {
      console.error('GptAuth query failed:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
    const authValue = authResult.rows.length > 0 ? authResult.rows[0].Auth_Code : null;

    // 查询 course
    let courseResult;
    try {
      courseResult = await pool.query(
        'SELECT "CourseContent" FROM course WHERE "CourseID" = $1',
        [usercontentID]
      );
      console.log('Course query result:', courseResult.rows);
    } catch (error) {
      console.error('Course query failed:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
    const courseprofile = courseResult.rows.length > 0 ? courseResult.rows[0].CourseContent : null;

    let CID = '';
    let redirectUrl = '';
    if (versionValue !== 1) {
      if (versionValue === 2) {
        redirectUrl = 'url associated with v2 gpt';
      } else if (versionValue === 3) {
        redirectUrl = 'url associated with v3 gpt';
      } else if (versionValue === 4) {
        redirectUrl = 'url associated with v3 gpt';
      } else {
        redirectUrl = 'url associated with v3 gpt ';
      }
    } else {
      redirectUrl = "url associated with v1 gpt";
    }

    const secretKey = process.env.JWT_SECRET_KEY as string;
    const token = jwt.sign(
      {
        username: user.UserName,
        password: modifiedPassword,
        experimentGroup: experimentGroup,
        gptAuth: authValue,
        profile: userProfile,
        prompt: userprompt,
        course: courseprofile
      },
      secretKey,
      { expiresIn: '24h' }
    );
    console.log('Generated token:', token);
    console.log('Redirect URL:', redirectUrl);
    return res.status(200).json({ success: true, token, redirect: redirectUrl, CID: CID });
  } catch (error) {
    console.error('Database connection or query failed:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Stack trace:', error.stack);
    }
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}