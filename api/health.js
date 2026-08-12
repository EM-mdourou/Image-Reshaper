export default function handler(req,res){
  return res.status(200).json({
    ok:true,
    version:"7.34",
    service:"Image Reshaper",
    reshapeRoute:"/api/reshape"
  });
}
