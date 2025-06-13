# # ... (previous imports and code remain the same until line 739)

#     # Llama-3.2-90b-vision request
#     llava_payload = {
#         "model": "meta-llama/llama-4-scout-17b-16e-instruct",
#         "messages": [
#             {
#                 "role": "user",
#                 "content": [
#                     {
#                         "type": "text",
#                         "text": query
#                     },
#                     {
#                         "type": "image_url",
#                         "image_url": {
#                             "url": f"data:image/jpeg;base64,{img_str}"
#                         }
#                     }
#                 ]
#             }
#         ]
#     }


#     llama_payload = {
#         "model": "meta-llama/llama-4-scout-17b-16e-instruct",
#         "messages": [
#             {
#                 "role": "user",
#                 "content": [
#                     {
#                         "type": "text",
#                         "text": query
#                     },
#                     {
#                         "type": "image_url",
#                         "image_url": {
#                             "url": f"data:image/jpeg;base64,{img_str}"
#                         }
#                     }
#                 ]
#             }
#         ]
#     }

#     # ... (rest of the code remains the same)
