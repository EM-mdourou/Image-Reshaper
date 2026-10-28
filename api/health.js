export default function handler(req,res){
  return res.status(200).json({
    ok:true,
    version:"8.15",
    service:"Image Reshaper",
    reshapeRoute:"/api/reshape"
  });
}
