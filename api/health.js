export default function handler(req,res){
  return res.status(200).json({
    ok:true,
    version:"7.21",
    service:"Muslim Link Image Reshaper",
    reshapeRoute:"/api/reshape"
  });
}
