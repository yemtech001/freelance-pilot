import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Pool} from 'pg';

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const app=express();
const port=Number(process.env.PORT||3000);
const pool=new Pool({connectionString:process.env.DATABASE_URL,max:Number(process.env.DB_POOL_MAX||10),ssl:process.env.DATABASE_SSL==='true'?{rejectUnauthorized:false}:undefined});
app.use(cors({origin:process.env.CORS_ORIGIN?process.env.CORS_ORIGIN.split(',').map(v=>v.trim()):true}));
app.use(express.json({limit:'1mb'}));

const prompts:Record<string,string>={
gig:'Act as a senior Fiverr and Upwork conversion strategist. Analyze the supplied gig/listing. Return a concise score out of 100, the 3 biggest conversion problems, keyword/positioning issues, and 5 specific improvements. Be practical and direct.',
proposal:'Write a tailored Fiverr/Upwork proposal from the supplied job post. Sound like a real experienced freelancer, not AI. Lead with the client problem, show relevant capability, propose a clear approach, ask one smart question, and finish with a natural call to action. Avoid generic filler.',
reply:'Write a concise, professional, human client reply to the supplied message. Be helpful and confident. Answer what the client needs and guide the conversation toward the next step.',
keywords:'Act as a marketplace SEO strategist. Based on the supplied service/niche, produce 12 focused Fiverr/Upwork keywords grouped into primary, supporting, and long-tail terms. Include a short positioning angle.',
description:'Write a high-converting Fiverr/Upwork gig description from the supplied service details. Use a strong hook, clarify the buyer pain, explain what is included, why the freelancer is a good fit, and a direct CTA.',
portfolio:'Turn the supplied project notes into a polished freelance portfolio case study with title, client challenge, approach, deliverables, tools/skills, outcome, and testimonial placeholder. Never invent metrics.',
reviews:'Write three natural review-request messages for a freelancer after project completion: friendly, professional, and very short.',
reminders:'Turn the supplied client/follow-up notes into a clear follow-up plan with timing, a concise follow-up message, and the next trigger.'
};

async function list(table:'crm_clients'|'earnings'){if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL is required');const{rows}=await pool.query(`SELECT * FROM ${table} ORDER BY created_at DESC LIMIT 100`);return rows}
app.get('/api/_healthcheck',async(_req,res)=>{try{await pool.query('SELECT 1');res.json({message:'Success',database:'ok'})}catch{res.status(503).json({message:'Database unavailable'})}});
app.get('/api/crm',async(_req,res,next)=>{try{res.json({items:await list('crm_clients')})}catch(e){next(e)}});
app.post('/api/crm',async(req,res,next)=>{try{const{name,service='',value=0,status='Lead'}=req.body??{};if(!String(name||'').trim())return res.status(400).json({error:'Client name is required'});const r=await pool.query('INSERT INTO crm_clients (name,service,value,status) VALUES ($1,$2,$3,$4) RETURNING id',[String(name).trim(),String(service),Number(value),String(status)]);res.status(201).json({id:r.rows[0].id})}catch(e){next(e)}});
app.delete('/api/crm/:id',async(req,res,next)=>{try{const r=await pool.query('DELETE FROM crm_clients WHERE id=$1 RETURNING id',[req.params.id]);if(!r.rowCount)return res.status(404).json({error:'Client not found'});res.json({deleted:true})}catch(e){next(e)}});
app.get('/api/earnings',async(_req,res,next)=>{try{res.json({items:await list('earnings')})}catch(e){next(e)}});
app.post('/api/earnings',async(req,res,next)=>{try{const{title,amount,platform='Direct',date=''}=req.body??{};if(!String(title||'').trim()||amount===undefined||Number(amount)<=0)return res.status(400).json({error:'Title and a positive amount are required'});const r=await pool.query('INSERT INTO earnings (title,amount,platform,date) VALUES ($1,$2,$3,$4) RETURNING id',[String(title).trim(),Number(amount),String(platform),String(date)]);res.status(201).json({id:r.rows[0].id})}catch(e){next(e)}});
app.post('/api/generate',async(req,res,next)=>{try{const tool=String(req.body?.tool||''),input=String(req.body?.input||'').trim();if(!input)return res.status(400).json({error:'Input is required'});if(!process.env.OPENAI_API_KEY)return res.status(503).json({error:'AI is not configured. Set OPENAI_API_KEY on the server.'});const response=await fetch(process.env.OPENAI_BASE_URL||'https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${process.env.OPENAI_API_KEY}`},body:JSON.stringify({model:process.env.OPENAI_MODEL||'gpt-4o-mini',temperature:.7,max_tokens:1200,messages:[{role:'system',content:(prompts[tool]||'Help a freelancer complete this task professionally.')+' Return only the useful deliverable.'},{role:'user',content:input}]})});const payload=await response.json().catch(()=>({}));if(!response.ok)return res.status(502).json({error:'Generation is temporarily unavailable. Please try again.'});const text=payload?.choices?.[0]?.message?.content;if(!text)return res.status(502).json({error:'The AI provider returned no usable result.'});res.json({text})}catch(e){next(e)}});
const frontendDist=path.resolve(__dirname,'../dist');
app.use(express.static(frontendDist));
app.get('*',(_req,res)=>res.sendFile(path.join(frontendDist,'index.html')));
app.use((error:unknown,_req:express.Request,res:express.Response,_next:express.NextFunction)=>{console.error(error);if(!res.headersSent)res.status(500).json({error:'Internal server error'})});
app.listen(port,()=>console.log(`FreelancePilot standalone server listening on ${port}`));